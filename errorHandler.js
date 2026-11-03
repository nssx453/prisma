export function notFound(req, res) {
    res.status(404).json({ error: "Маршрут не найден" });
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    if (err.code === "P2002") return res.status(409).json({ error: "Такая запись уже существует" });
    if (err.code === "P2025") return res.status(404).json({ error: "Запись не найдена" });
    if (err.code === "P2003") return res.status(409).json({ error: "Есть связанные записи" });
    if (err.code === "P2023") return res.status(400).json({ error: "Некорректный id" });
    if (err.isJoi) return res.status(400).json({ error: err.details.map((d) => d.message) });

    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
}

export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);