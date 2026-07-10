// ============================================
// Notion API 串接邏輯
// 這個檔案是整個專案「後台」與「前端」溝通的橋樑
// 所有跟 Notion 要資料的動作都寫在這裡，方便日後維護
//
// ⚠️ 這個檔案只能在「伺服器端」執行（Server Component / Route Handler）
// 因為裡面用到 NOTION_TOKEN，絕對不能被打包進瀏覽器端的程式碼
// ============================================

import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import type { Recipe } from '@/types/recipe';

// 初始化 Notion 官方 SDK，使用環境變數中的 Integration Token 進行身分驗證
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// 資料庫 ID 也是從環境變數讀取，方便未來切換不同資料庫（例如測試/正式環境分開）
const databaseId = process.env.NOTION_DATABASE_ID as string;

/**
 * 將 Notion 回傳的原始 Page 物件，轉換成我們自訂的 Recipe 型別
 * 這一層「轉換」很重要：前端元件完全不需要知道 Notion API 複雜的巢狀資料結構
 *
 * ⚠️ 這裡的屬性名稱（'Name'、'Category'...）必須跟你在 Notion 資料庫中
 * 建立的欄位名稱完全一致（區分大小寫）
 */
function mapPageToRecipe(page: PageObjectResponse): Recipe {
  const props = page.properties;

  // 菜名：對應 Notion 的 Title 型態欄位
  const nameProp = props['Name'];
  const name =
    nameProp?.type === 'title'
      ? nameProp.title.map((t) => t.plain_text).join('')
      : '未命名菜色';

  // 分類：對應 Notion 的 Multi-select 型態欄位
  const categoryProp = props['Category'];
  const categories =
    categoryProp?.type === 'multi_select'
      ? categoryProp.multi_select.map((c) => c.name)
      : [];

  // 食材：對應 Notion 的 Rich text 型態欄位
  const ingredientsProp = props['Ingredients'];
  const ingredients =
    ingredientsProp?.type === 'rich_text'
      ? ingredientsProp.rich_text.map((t) => t.plain_text).join('')
      : '';

  // 烹飪時間：對應 Notion 的 Number 型態欄位
  const cookTimeProp = props['CookTime'];
  const cookTime =
    cookTimeProp?.type === 'number' ? cookTimeProp.number : null;

  // 圖片：對應 Notion 的 Files & media 型態欄位，取第一張圖片的網址
  // Notion 的圖片分兩種來源：直接上傳的檔案（file）或外部連結（external）
  const coverProp = props['Cover'];
  let coverUrl: string | null = null;
  if (coverProp?.type === 'files' && coverProp.files.length > 0) {
    const file = coverProp.files[0];
    if (file.type === 'file') {
      coverUrl = file.file.url;
    } else if (file.type === 'external') {
      coverUrl = file.external.url;
    }
  }

  return {
    id: page.id,
    name,
    categories,
    ingredients,
    cookTime,
    coverUrl,
  };
}

/**
 * 取得所有「已公開（Published = true）」的食譜
 * @param category 選填，若有帶入則只回傳該分類的食譜
 */
export async function getPublishedRecipes(
  category?: string
): Promise<Recipe[]> {
  // 篩選條件：Published 欄位必須勾選（true）
  const andFilters: any[] = [
    {
      property: 'Published',
      checkbox: { equals: true },
    },
  ];

  // 如果使用者有指定分類，加入「多選欄位包含此分類」的篩選條件
  if (category) {
    andFilters.push({
      property: 'Category',
      multi_select: { contains: category },
    });
  }

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: { and: andFilters },
    // 依建立時間新到舊排序，最新加入的食譜會顯示在最前面
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  });

  return (response.results as PageObjectResponse[]).map(mapPageToRecipe);
}

/**
 * 依 Notion 頁面 ID 取得單一食譜的基本資料（標題、分類、食材等屬性）
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    return mapPageToRecipe(page as PageObjectResponse);
  } catch (error) {
    // 常見情況：ID 打錯、頁面被刪除，或該頁面沒有分享給 Integration
    console.error('取得食譜資料失敗：', error);
    return null;
  }
}

/**
 * 取得食譜「頁面內文」的所有區塊（Blocks）
 * 這裡假設你把「做法 / 步驟」直接寫在 Notion 頁面內文中
 * 而不是另外開一個欄位，這樣在 Notion 編輯起來也比較直覺、排版自由
 */
export async function getRecipeBlocks(
  id: string
): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined = undefined;

  // Notion API 一次最多回傳 100 筆區塊，內容較長時需要用 cursor 分頁抓取
  do {
    const response = await notion.blocks.children.list({
      block_id: id,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...(response.results as BlockObjectResponse[]));
    cursor = response.has_more ? (response.next_cursor as string) : undefined;
  } while (cursor);

  return blocks;
}
