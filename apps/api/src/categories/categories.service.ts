import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryNode {
  id: string;
  key: string;
  name: { en: string; si: string; ta: string };
  children: CategoryNode[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the active category tree (top-level with nested sub-categories, incl. Solar). */
  async tree(): Promise<CategoryNode[]> {
    const all = await this.prisma.categories.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    });

    const toNode = (c: (typeof all)[number]): CategoryNode => ({
      id: c.id,
      key: c.key,
      name: { en: c.name_en, si: c.name_si, ta: c.name_ta },
      children: [],
    });

    const byId = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    all.forEach((c) => byId.set(c.id, toNode(c)));
    all.forEach((c) => {
      const node = byId.get(c.id)!;
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }
}
