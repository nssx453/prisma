import { Prisma } from "../generated/prisma/index.js";

export function errorHandler(err, req, res, next) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return res.status(404).json({ error: "Запись не найдена" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return res.status(409).json({ error: "Конфликт уникальности" });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        return res.status(400).json({ error: "Нарушение внешнего ключа" });
    }

    console.error(err);
    return res.status(500).json({ error: "Ошибка сервера" });
}
