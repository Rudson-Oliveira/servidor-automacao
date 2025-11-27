# 🛡️ Padrões Anti-Flickering

## Problema

Ao implementar funcionalidades complexas (como Vercept-like screen capture), a interface pode começar a **piscar/flickering** devido a re-renders infinitos ou excessivos.

## Causas Comuns

### 1. Funções Criadas em Cada Render

```tsx
// ❌ ERRADO: Nova função a cada render
function MyComponent() {
  const formatDate = (date) => new Date(date).toLocaleString();
  
  return <div>{formatDate(someDate)}</div>;
}

// ✅ CORRETO: Memoizar função
function MyComponent() {
  const formatDate = useMemo(() => 
    (date) => new Date(date).toLocaleString(),
    []
  );
  
  return <div>{formatDate(someDate)}</div>;
}
```

### 2. Objetos/Arrays Criados Inline

```tsx
// ❌ ERRADO: Novo objeto a cada render
const { data } = useQuery({ 
  enabled: !!selectedId  // Novo boolean a cada render
});

// ✅ CORRETO: Memoizar condição
const enabled = useMemo(() => !!selectedId, [selectedId]);
const { data } = useQuery({ enabled });
```

### 3. Handlers Sem useCallback

```tsx
// ❌ ERRADO: Nova função a cada render
function MyComponent() {
  const handleClick = (id) => {
    console.log(id);
  };
  
  return <Button onClick={handleClick} />;
}

// ✅ CORRETO: useCallback
function MyComponent() {
  const handleClick = useCallback((id) => {
    console.log(id);
  }, []);
  
  return <Button onClick={handleClick} />;
}
```

### 4. Refetch Manual Após Mutations

```tsx
// ❌ ERRADO: Refetch manual pode causar loops
const mutation = useMutation({
  onSuccess: () => {
    refetch(); // Pode causar re-render infinito
  }
});

// ✅ CORRETO: Invalidação inteligente
const utils = trpc.useUtils();
const mutation = useMutation({
  onSuccess: () => {
    utils.myQuery.invalidate(); // React Query gerencia automaticamente
  }
});
```

### 5. Componentes Não Memoizados

```tsx
// ❌ ERRADO: Re-renderiza sempre que pai renderiza
function ChildComponent({ data }) {
  return <div>{data.name}</div>;
}

// ✅ CORRETO: React.memo previne re-renders desnecessários
const ChildComponent = memo(({ data }) => {
  return <div>{data.name}</div>;
});
```

---

## Ferramentas de Debugging

### 1. useWhyDidYouUpdate

```tsx
import { useWhyDidYouUpdate } from '@/hooks/useWhyDidYouUpdate';

function MyComponent(props) {
  useWhyDidYouUpdate('MyComponent', props);
  
  return <div>...</div>;
}
```

**Output no console:**
```
[why-did-you-update] MyComponent {
  data: { from: [...], to: [...] },
  isLoading: { from: false, to: true }
}
```

### 2. React DevTools Profiler

1. Abrir React DevTools
2. Ir para aba "Profiler"
3. Clicar em "Record"
4. Interagir com a interface
5. Analisar componentes que re-renderizam muito

### 3. Console Logging

```tsx
function MyComponent() {
  console.log('[RENDER] MyComponent');
  
  useEffect(() => {
    console.log('[MOUNT] MyComponent');
    return () => console.log('[UNMOUNT] MyComponent');
  }, []);
  
  return <div>...</div>;
}
```

---

## Checklist Anti-Flickering

Antes de implementar funcionalidades complexas, verifique:

- [ ] **Funções inline**: Todas as funções usam `useMemo` ou `useCallback`?
- [ ] **Objetos/arrays**: Todos os objetos/arrays são memoizados?
- [ ] **Handlers**: Todos os event handlers usam `useCallback`?
- [ ] **Componentes filhos**: Componentes pesados usam `React.memo`?
- [ ] **Queries**: `enabled` é estável (memoizado)?
- [ ] **Mutations**: Usam `invalidate` ao invés de `refetch`?
- [ ] **useEffect**: Dependências estão corretas?
- [ ] **Imagens**: Usam `loading="lazy"`?
- [ ] **Listas**: Usam `key` estável (não index)?

---

## Padrões Recomendados

### Pattern 1: Componente Memoizado com Handlers Estáveis

```tsx
const MyCard = memo(({ 
  data, 
  onEdit, 
  onDelete 
}: {
  data: any;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <Card>
      <Button onClick={() => onEdit(data.id)}>Editar</Button>
      <Button onClick={() => onDelete(data.id)}>Deletar</Button>
    </Card>
  );
});

function ParentComponent() {
  const handleEdit = useCallback((id: number) => {
    // ...
  }, []);

  const handleDelete = useCallback((id: number) => {
    // ...
  }, []);

  return <MyCard data={data} onEdit={handleEdit} onDelete={handleDelete} />;
}
```

### Pattern 2: Query com Enabled Estável

```tsx
function MyComponent() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Memoizar condição enabled
  const enabled = useMemo(() => !!selectedId, [selectedId]);
  
  const { data } = trpc.myQuery.useQuery(
    { id: selectedId! },
    { enabled }
  );
  
  return <div>...</div>;
}
```

### Pattern 3: Mutation com Invalidação Inteligente

```tsx
function MyComponent() {
  const utils = trpc.useUtils();
  
  const mutation = trpc.myMutation.useMutation({
    onSuccess: () => {
      toast.success("Sucesso!");
      // Invalidar ao invés de refetch
      utils.myQuery.invalidate();
    }
  });
  
  return <div>...</div>;
}
```

### Pattern 4: useStableCallback para Callbacks Complexos

```tsx
import { useStableCallback } from '@/hooks/useStableCallback';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  // Sempre acessa o valor mais recente sem precisar de dependências
  const handleClick = useStableCallback(() => {
    console.log(count); // Sempre o valor atual
  });
  
  return <Button onClick={handleClick}>Click</Button>;
}
```

---

## Exemplo Completo: DesktopCapturesProtected

Veja `client/src/pages/DesktopCapturesProtected.tsx` para um exemplo completo de implementação com todas as proteções anti-flickering.

**Proteções implementadas:**
1. ✅ `useMemo` para formatDate
2. ✅ `useCallback` para handlers
3. ✅ `useStableCallback` para callbacks complexos
4. ✅ `React.memo` em componentes filhos (CaptureCard, StatisticsCards)
5. ✅ Invalidação inteligente (sem refetch manual)
6. ✅ Enabled condicional estável
7. ✅ `loading="lazy"` em imagens
8. ✅ Keys estáveis em listas

---

## Quando Usar Cada Hook

| Hook | Quando Usar | Exemplo |
|------|-------------|---------|
| `useMemo` | Cálculos pesados, objetos/arrays | `const data = useMemo(() => [...], [deps])` |
| `useCallback` | Event handlers, funções passadas como props | `const onClick = useCallback(() => {}, [])` |
| `useStableCallback` | Callbacks que precisam acessar estado mais recente | `const onClick = useStableCallback(() => {})` |
| `React.memo` | Componentes que re-renderizam muito | `const MyComp = memo(({ data }) => ...)` |
| `useWhyDidYouUpdate` | Debugging de re-renders | `useWhyDidYouUpdate('MyComp', props)` |

---

## Troubleshooting

### Problema: Interface ainda pisca

1. Adicionar `useWhyDidYouUpdate` no componente problemático
2. Verificar console para identificar props que mudam
3. Memoizar props que mudam desnecessariamente
4. Verificar se componentes pais estão causando re-renders

### Problema: useCallback não funciona

- Verifique se as dependências estão corretas
- Use `useStableCallback` se precisar acessar estado mais recente
- Verifique se o componente filho usa `React.memo`

### Problema: Mutation causa loop infinito

- Remover `refetch()` do `onSuccess`
- Usar `utils.query.invalidate()` ao invés
- Verificar se `useEffect` não está disparando mutation

---

## Recursos Adicionais

- [React Docs: useMemo](https://react.dev/reference/react/useMemo)
- [React Docs: useCallback](https://react.dev/reference/react/useCallback)
- [React Docs: memo](https://react.dev/reference/react/memo)
- [TanStack Query: Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
