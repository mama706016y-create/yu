// /api/recipes.js
// 這是 Vercel Serverless Function，扮演「安全轉接站」的角色
// 前端網頁不會直接碰到 Notion API Token，所有敏感資訊都留在後端環境變數中

export default async function handler(req, res) {
  // 只允許 GET 請求，避免不必要的呼叫方式
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只允許 GET 請求' });
  }

  // 從 Vercel 環境變數讀取金鑰（在 Vercel 後台設定，不會出現在程式碼中）
  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  // 安全檢查：如果忘記設定環境變數，提早回傳錯誤訊息，方便除錯
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: '伺服器尚未設定 NOTION_TOKEN 或 NOTION_DATABASE_ID' });
  }

  try {
    // 呼叫 Notion 官方 API，查詢資料庫內容
    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28', // Notion API 版本號，固定寫死避免未來改版壞掉
          'Content-Type': 'application/json',
        },
        // 依照「建立時間」排序，新食譜會排在後面（可自行改成想要的排序方式）
        body: JSON.stringify({
          sorts: [
            {
              timestamp: 'created_time',
              direction: 'descending',
            },
          ],
        }),
      }
    );

    if (!notionResponse.ok) {
      const errorDetail = await notionResponse.text();
      console.error('Notion API 錯誤:', errorDetail);
      return res.status(notionResponse.status).json({ error: 'Notion 資料讀取失敗', detail: errorDetail });
    }

    const data = await notionResponse.json();

    // 將 Notion 回傳的複雜資料結構，整理成前端好用的簡單格式
    const recipes = data.results.map((page) => {
      const properties = page.properties;

      // 1. 菜名（Title 類型欄位）
      const name =
        properties['Name']?.title?.[0]?.plain_text || '未命名料理';

      // 2. 分類（Multi-select 多選標籤）：主食、副菜、湯品、甜點
      const categories =
        properties['分類']?.multi_select?.map((tag) => tag.name) || [];

      // 3. 食材（Rich Text 富文本，可能由多段組成，需要串接起來）
      const ingredients =
        properties['食材']?.rich_text?.map((t) => t.plain_text).join('') || '';

      // 4. 烹飪時間（Number 數字，單位分鐘）
      const cookTime = properties['烹飪時間']?.number ?? null;

      // 5. 圖片（Files & media，可能是「上傳到 Notion」或「外部連結」兩種型態）
      let imageUrl = '';
      const fileItem = properties['圖片']?.files?.[0];
      if (fileItem) {
        if (fileItem.type === 'file') {
          // Notion 內部託管圖片，網址會定期過期（約 1 小時），但單次請求內可正常顯示
          imageUrl = fileItem.file.url;
        } else if (fileItem.type === 'external') {
          // 外部連結圖片（例如 Imgur），網址是永久有效的，建議優先使用
          imageUrl = fileItem.external.url;
        }
      }

      return {
        id: page.id,
        name,
        categories,
        ingredients,
        cookTime,
        imageUrl,
      };
    });

    // 設定快取標頭：60 秒內重複請求會直接用 CDN 快取結果，減少 Notion API 呼叫次數
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ recipes });
  } catch (error) {
    console.error('伺服器內部錯誤:', error);
    return res.status(500).json({ error: '伺服器發生未預期的錯誤', detail: error.message });
  }
}
