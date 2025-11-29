'use server';

import { revalidatePath } from 'next/cache';

const PRODUCT_PATHS = ['/products'];

export async function revalidateProductPages() {
  await Promise.all(
    PRODUCT_PATHS.map(async (path) => {
      try {
        revalidatePath(path);
      } catch (error) {
        console.error(`[revalidate] Failed for ${path}`, error);
      }
    }),
  );
}


