import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Cadastro
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, dataNascimento, telefone } = req.body;

    // Validações
    if (!nome || !email || !senha || !dataNascimento || !telefone) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Todos os campos são obrigatórios',
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Banco de dados indisponível',
      });
    }

    // Verificar se email já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Email já cadastrado',
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir usuário
    await db.insert(users).values({
      name: nome,
      email,
      password: hashedPassword,
      dateOfBirth: new Date(dataNascimento),
      phone: telefone,
      openId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`, // OpenId temporário para usuários locais
      loginMethod: 'local',
      role: 'user',
    });

    res.json({
      sucesso: true,
      mensagem: 'Cadastro realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao realizar cadastro',
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Email e senha são obrigatórios',
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Banco de dados indisponível',
      });
    }

    // Buscar usuário
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (result.length === 0) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Email ou senha incorretos',
      });
    }

    const user = result[0];

    // Verificar senha
    if (!user.password) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não possui senha cadastrada',
      });
    }

    const senhaValida = await bcrypt.compare(senha, user.password);
    
    if (!senhaValida) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Email ou senha incorretos',
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret-key-default',
      { expiresIn: '7d' }
    );

    // Atualizar lastSignedIn
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: user.id,
        nome: user.name,
        email: user.email,
        telefone: user.phone,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao realizar login',
    });
  }
});

export default router;
