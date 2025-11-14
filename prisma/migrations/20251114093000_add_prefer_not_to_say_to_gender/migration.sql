-- 扩展性别枚举支持“不愿透露”选项
ALTER TYPE "Gender" ADD VALUE IF NOT EXISTS 'PREFER_NOT_TO_SAY';

