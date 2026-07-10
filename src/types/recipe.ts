// ============================================
// 食譜資料的型別定義
// 這個檔案定義了「Notion 資料庫」轉換到「前端」後的資料結構
// 之後所有元件都是依賴這個 Recipe 型別，不需要理解 Notion API 原始格式
// ============================================

export interface Recipe {
  id: string; // Notion 頁面的 ID，同時作為網址路由參數（例如 /recipes/xxxx）
  name: string; // 菜名
  categories: string[]; // 分類標籤，例如 ['主食', '湯品']（一道菜可以有多個分類）
  ingredients: string; // 食材說明（純文字，若有多樣食材建議用換行或頓號分隔）
  cookTime: number | null; // 烹飪時間（單位：分鐘）
  coverUrl: string | null; // 封面圖片網址（取自 Notion 的 Files & media 欄位）
}

// 分類篩選會用到的固定選項
// ⚠️ 注意：這裡的字串必須和你在 Notion 資料庫「Category」欄位中設定的選項名稱一模一樣
// 如果不一致，篩選功能會抓不到資料
export const CATEGORIES = ['主食', '副菜', '湯品', '甜點'] as const;

export type Category = (typeof CATEGORIES)[number];
