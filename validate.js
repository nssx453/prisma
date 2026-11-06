import Joi from "joi";

export function validate(schema, prop = "body") {
    return function (req, res, next) {
        const { error, value } = schema.validate(req[prop], {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            return res.status(400).json({ error: error.details.map((d) => d.message) });
        }
        req[prop] = value;
        next();
    };
}

export const userCreateSchema = Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(1).max(100).required(),
    role: Joi.string().valid("USER", "ADMIN").default("USER"),
});

export const userUpdateSchema = Joi.object({
    email: Joi.string().email(),
    name: Joi.string().min(1).max(100),
    role: Joi.string().valid("USER", "ADMIN"),
}).min(1);

export const postCreateSchema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().allow("", null),
    published: Joi.boolean().default(false),
    authorId: Joi.number().integer().positive().required(),
    tags: Joi.array().items(Joi.string().min(1)).unique().default([]),
});

export const postUpdateSchema = Joi.object({
    title: Joi.string().min(1).max(200),
    content: Joi.string().allow("", null),
    published: Joi.boolean(),
    tags: Joi.array().items(Joi.string().min(1)).unique(),
}).min(1);
