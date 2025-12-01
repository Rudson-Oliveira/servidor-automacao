import { vi } from "vitest";

// Mockar apenas db-desktop-control globalmente (usado em muitos testes)
vi.mock("./server/db-desktop-control", () => import("./server/__mocks__/db-desktop-control"));

// Nota: Outros mocks devem ser feitos localmente em cada arquivo de teste
// para evitar efeitos colaterais indesejados
