import express from "express";
import Joi from "joi";
import { prisma } from "./config/index.js";

const app = express();
app.use(express.json());

const postSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().allow("", null),
    published: Joi.boolean(),
    authorId: Joi.number().integer().positive().required(),
    tags: Joi.array().items(Joi.string()),
});

app.get("/api/users", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const data = await prisma.user.findMany({ skip, take: limit });
    const total = await prisma.user.count();

    res.json({
        data: data,
        meta: {
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit),
        },
    });
});

app.get("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
        where: { id: id },
        include: {
            posts: { orderBy: { createdAt: "desc" } },
        },
    });

    if (!user) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
    }
    res.json(user);
});

app.post("/api/users", async (req, res) => {
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
});

app.patch("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    const user = await prisma.user.update({
        where: { id: id },
        data: req.body,
    });
    res.json(user);
});

app.delete("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id: id } });
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
    if (req.query.published === "true") {
        where.published = true;
    }
    if (req.query.published === "false") {
        where.published = false;
    }
    if (req.query.authorId) {
        where.authorId = Number(req.query.authorId);
    }

    const data = await prisma.post.findMany({
        where: where,
        skip: skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { author: true, tags: true },
    });
    const total = await prisma.post.count({ where: where });

    res.json({
        data: data,
        meta: {
            total: total,
            page: page,
            limit: limit,
            pages: Math.ceil(total / limit),
        },
    });
});

app.get("/api/posts/:id", async (req, res) => {
    const id = Number(req.params.id);
    const post = await prisma.post.findUnique({
        where: { id: id },
        include: { author: true, tags: true },
    });

    if (!post) {
        res.status(404).json({ error: "Пост не найден" });
        return;
    }
    res.json(post);
});

app.post("/api/posts", async (req, res) => {
    const { error, value } = postSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const tagList = [];
    if (value.tags) {
        for (const name of value.tags) {
            tagList.push({ where: { name: name }, create: { name: name } });
        }
    }

    const post = await prisma.post.create({
        data: {
            title: value.title,
            content: value.content,
            published: value.published,
            authorId: value.authorId,
            tags: { connectOrCreate: tagList },
        },
        include: { author: true, tags: true },
    });

    res.status(201).json(post);
});

app.patch("/api/posts/:id", async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body;
    const data = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.published !== undefined) data.published = body.published;

    if (body.tags !== undefined) {
        const tagList = [];
        for (const name of body.tags) {
            tagList.push({ where: { name: name }, create: { name: name } });
        }
        data.tags = { set: [], connectOrCreate: tagList };
    }

    const post = await prisma.post.update({
        where: { id: id },
        data: data,
        include: { author: true, tags: true },
    });
    res.json(post);
});

app.delete("/api/posts/:id", async (req, res) => {
    const id = Number(req.params.id);
    await prisma.post.delete({ where: { id: id } });
    res.sendStatus(204);
});

app.listen(3000, () => {
    console.log("сервер запущен...");
});