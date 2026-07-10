// ============================================
// Notion Blocks 渲染元件
// 負責把 Notion 頁面內文（做法步驟）轉換成網頁可以顯示的 HTML
// 只支援食譜常用的區塊類型，涵蓋大部分「寫食譜步驟」的需求
// ============================================

import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

/**
 * 將 Notion 的 Rich Text 陣列轉換成 React 節點
 * 支援基本的文字樣式：粗體、斜體、刪除線、行內程式碼、超連結
 */
function renderRichText(richTextArray: RichTextItemResponse[]) {
  return richTextArray.map((text, index) => {
    let node: React.ReactNode = text.plain_text;

    if (text.annotations.code) {
      node = (
        <code
          key={index}
          className="bg-card px-1.5 py-0.5 rounded text-saffron font-mono text-[0.9em]"
        >
          {node}
        </code>
      );
    }
    if (text.annotations.bold) {
      node = <strong key={index}>{node}</strong>;
    }
    if (text.annotations.italic) {
      node = <em key={index}>{node}</em>;
    }
    if (text.annotations.strikethrough) {
      node = <s key={index}>{node}</s>;
    }
    if (text.href) {
      node = (
        <a
          key={index}
          href={text.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-saffron underline underline-offset-2"
        >
          {node}
        </a>
      );
    }

    return <span key={index}>{node}</span>;
  });
}

// 單一區塊的渲染邏輯，依照 Notion 區塊類型（type）決定要輸出什麼 HTML 標籤
function renderBlock(block: BlockObjectResponse) {
  switch (block.type) {
    case 'paragraph':
      // 忽略內容為空的段落，避免畫面出現多餘空白
      if (block.paragraph.rich_text.length === 0) return null;
      return (
        <p className="mb-4 leading-relaxed text-parchment/90">
          {renderRichText(block.paragraph.rich_text)}
        </p>
      );

    case 'heading_1':
      return (
        <h2 className="font-display text-2xl mt-8 mb-3 text-parchment">
          {renderRichText(block.heading_1.rich_text)}
        </h2>
      );

    case 'heading_2':
      return (
        <h3 className="font-display text-xl mt-6 mb-2 text-parchment">
          {renderRichText(block.heading_2.rich_text)}
        </h3>
      );

    case 'heading_3':
      return (
        <h4 className="font-display text-lg mt-4 mb-2 text-parchment">
          {renderRichText(block.heading_3.rich_text)}
        </h4>
      );

    case 'bulleted_list_item':
      return (
        <li className="mb-2 leading-relaxed text-parchment/90 list-disc ml-5 marker:text-saffron">
          {renderRichText(block.bulleted_list_item.rich_text)}
        </li>
      );

    case 'numbered_list_item':
      return (
        <li className="mb-2 leading-relaxed text-parchment/90 list-decimal ml-5 marker:text-saffron marker:font-bold">
          {renderRichText(block.numbered_list_item.rich_text)}
        </li>
      );

    case 'to_do':
      return (
        <div className="flex items-start gap-2 mb-2">
          <input
            type="checkbox"
            defaultChecked={block.to_do.checked}
            disabled
            className="mt-1.5 accent-saffron"
          />
          <span className="text-parchment/90">
            {renderRichText(block.to_do.rich_text)}
          </span>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-2 border-saffron pl-4 my-4 italic text-parchment/80">
          {renderRichText(block.quote.rich_text)}
        </blockquote>
      );

    case 'divider':
      return <hr className="my-6 border-parchment/15" />;

    case 'image': {
      const src =
        block.image.type === 'file'
          ? block.image.file.url
          : block.image.external.url;
      const caption = block.image.caption?.map((c) => c.plain_text).join('');
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={caption || '食譜步驟圖片'}
            className="rounded-lg w-full object-cover"
          />
          {caption && (
            <figcaption className="text-sm text-parchment/50 mt-2 text-center">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'code':
      return (
        <pre className="bg-card p-4 rounded-lg my-4 overflow-x-auto">
          <code className="font-mono text-sm text-parchment/90">
            {block.code.rich_text.map((t) => t.plain_text).join('')}
          </code>
        </pre>
      );

    default:
      // 遇到不支援的區塊類型（例如影片、資料庫連結等）就直接跳過，不中斷渲染
      return null;
  }
}

// 主要匯出元件：接收整份區塊陣列，並把「連續的清單項目」包在同一個 ul/ol 裡
export default function NotionBlocks({
  blocks,
}: {
  blocks: BlockObjectResponse[];
}) {
  const elements: React.ReactNode[] = [];
  let currentList: BlockObjectResponse[] = [];
  let currentListType: 'bulleted_list_item' | 'numbered_list_item' | null =
    null;

  const flushList = (key: string) => {
    if (currentList.length === 0) return;
    const Tag = currentListType === 'numbered_list_item' ? 'ol' : 'ul';
    elements.push(
      <Tag key={key}>{currentList.map((b) => renderBlock(b))}</Tag>
    );
    currentList = [];
    currentListType = null;
  };

  blocks.forEach((block, index) => {
    if (
      block.type === 'bulleted_list_item' ||
      block.type === 'numbered_list_item'
    ) {
      // 若清單類型改變（例如從項目符號換成編號），先把前一組清單輸出
      if (currentListType && currentListType !== block.type) {
        flushList(`list-${index}`);
      }
      currentListType = block.type;
      currentList.push(block);
    } else {
      flushList(`list-${index}`);
      elements.push(<div key={block.id}>{renderBlock(block)}</div>);
    }
  });
  flushList('list-final');

  if (blocks.length === 0) {
    return (
      <p className="text-parchment/50 italic">
        這道食譜還沒有寫下做法步驟，快回 Notion 補上吧！
      </p>
    );
  }

  return <div>{elements}</div>;
}
