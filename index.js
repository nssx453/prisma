import express from "express";
import { prisma } from "./config/index.js";
import { errorHandler } from "./errorHandler.js";
import {
    validate,
    userCreateSchema,
    userUpdateSchema,
    postCreateSchema,
    postUpdateSchema,
} from "./validate.js";

const app = express();
app.use(express.json());

app.get("/api/users", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({ skip, take: limit });
    res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
        where: { id },
        include: { posts: { orderBy: { createdAt: "desc" } } },
    });

    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(user);
});

app.post("/api/users", validate(userCreateSchema), async (req, res) => {
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
});

app.patch("/api/users/:id", validate(userUpdateSchema), async (req, res) => {
    const id = Number(req.params.id);
    const user = await prisma.user.update({ where: { id }, data: req.body });
    res.json(user);
});

app.delete("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });
    res.sendStatus(204);
});

app.get("/api/posts", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};

    if (req.query.search) {
        where.title = { contains: req.query.search };
    }
    if (req.query.published === "true") where.published = true;
    if (req.query.published === "false") where.published = false;
    if (req.query.authorId) where.authorId = Number(req.query.authorId);

    const data = await prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { author: true, tags: true },
    });
    const total = await prisma.post.count({ where });

    res.json({
        data,
        meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
});

app.get("/api/posts/:id", async (req, res) => {
    const id = Number(req.params.id);
    const post = await prisma.post.findUnique({
        where: { id },
        include: { author: true, tags: true },
    });

    if (!post) {
        return res.status(404).json({ error: "Пост не найден" });
    }
    res.json(post);
});

app.post("/api/posts", validate(postCreateSchema), async (req, res) => {
    const { title, content, published, authorId, tags } = req.body;

    const tagList = (tags || []).map((name) => ({
        where: { name },
        create: { name },
    }));

    const post = await prisma.post.create({
        data: {
            title,
            content,
            published,
            authorId,
            tags: { connectOrCreate: tagList },
        },
        include: { author: true, tags: true },
    });

    res.status(201).json(post);
});

app.patch("/api/posts/:id", validate(postUpdateSchema), async (req, res) => {
    const id = Number(req.params.id);
    const { title, content, published, tags } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;
    if (tags !== undefined) {
        data.tags = {
            set: [],
            connectOrCreate: tags.map((name) => ({ where: { name }, create: { name } })),
        };
    }

    const post = await prisma.post.update({
        where: { id },
        data,
        include: { author: true, tags: true },
    });

    res.json(post);
});

app.delete("/api/posts/:id", async (req, res) => {
    const id = Number(req.params.id);
    await prisma.post.delete({ where: { id } });
    res.sendStatus(204);
});

app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден" });
});

app.use(errorHandler);

app.listen(3000, () => {
    console.log("сервер запущен...");
});
