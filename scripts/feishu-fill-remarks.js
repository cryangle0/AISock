/**
 * 批量写入飞书 Bitable「备注」列（表格内编辑，一次落库多条）
 * 需在已登录飞书的浏览器控制台或 Puppeteer 页面中执行核心逻辑。
 *
 * Usage (Puppeteer): node scripts/feishu-fill-remarks.js
 */
const puppeteer = require('puppeteer');

const WIKI_URL =
  'https://my.feishu.cn/wiki/IOX4wOPWpiM0e7klQcscw7f9njd?table=tblt71WCcW4LUngs&view=vewWHFaE6p';
const OBJ_TOKEN = 'NbhqbK5OfahIaOsA7nAc3uaonXb';
const TABLE_ID = 'tblt71WCcW4LUngs';

/** 按 BUG名称 关键词匹配行，写入备注列 */
const ITEMS = [
  {
    keyword: '要按照卡片内容相对应地配置好图片',
    id: 'recvmLp2DS3mGO',
    text: '【验收说明】已在后台配置卡片配图并同步 CDN（migration 011 + onnsa.cn/aisock）；各卡片封面与后台花型/配置项对应。',
  },
  {
    keyword: '发现页的图片没有地方配置',
    id: 'recvmYDpp64RW9',
    text: '【验收说明】发现页轮播图、商品详情配图可在后台「小程序配置」中维护；Feed/发现接口已对接配置项。',
  },
  {
    keyword: '点击上面的主题',
    id: 'recvmYDHR6hcdE',
    text: '【验收说明】首页顶部主题 Tab 点击切换下方三张主题图（不再跳转浏览页）；主题图点击跳转可配置的商品详情页。',
  },
  {
    keyword: '浏览页的标题',
    id: 'recvmYDUlDwcTB',
    text: '【验收说明】浏览/Feed 页标题可在后台配置中修改，前端从 catalog 配置读取展示。',
  },
  {
    keyword: '推荐花型的封面图',
    id: 'recvmYEDlAoGhB',
    text: '【验收说明】AI 助手推荐花型封面、礼赠/风格图标及人群花型类别均在后台 AI 配置与标签管理中可配（icon_url + 标签关联）。',
  },
  {
    keyword: '袜版渲染有问题',
    id: 'recvmYFOyo2mSO',
    text: '【验收说明】sockVector 修复袜头/袜跟/螺口缝隙；袜头袜跟初始颜色改为白色；已构建小程序验证。',
  },
  {
    keyword: '去定制界面的灵感参考',
    id: 'recvmYGaDBDQfq',
    text: '【验收说明】去定制页「灵感参考」图可在后台 upload_refs 配置项中上传维护，前端编辑器读取展示。',
  },
  {
    keyword: 'web端的推荐页面',
    id: 'recvmYGUeaH1Sl',
    text: '【验收说明·后台配置】Web 推荐 Tab → 标签管理 → 主题(发现/Web推荐)，给花型打主题标签后 Web 推荐页按主题展示；卡片点击跳转商品详情（与小程序一致）。',
  },
  {
    keyword: 'web端袜版的渲染',
    id: 'recvmYHhgIO2Qa',
    text: '【验收说明】Web 编辑器袜版矢量渲染与小程序对齐：袜头/袜跟/螺口初始白色，缝隙问题已修复（vectorSock 默认色）。',
  },
  {
    keyword: '首页渐变动效',
    id: 'recvmYIczahpgA',
    text: '【验收说明】首页渐变动效初始形态改为袜版轮廓形状（非通用图形）。',
  },
  {
    keyword: 'web端的模板预设',
    id: 'recvmYISU3kxH2',
    text: '【验收说明·后台配置】Web 模板预设 → 小程序/Web 首页配置 → home_cases：填写封面图 + 跳转链接（如 pattern:52 或 /product/52）。',
  },
  {
    keyword: '花型库同步',
    id: 'recvmYJ00pz1Gf',
    text: '【验收说明·后台配置】花型库 → 花型素材（Web 编辑器公共库自动同步小程序素材）；推荐页卡片名「1/2/3」为花型名称本身，可在花型素材中改为正式名称。',
  },
];

async function waitForBitable(page, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await page.evaluate(() => !!window.BitableTestTool?.showCell);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('BitableTestTool not ready');
}

async function batchFillRemarks(page, items) {
  return page.evaluate(async (rows) => {
    const tt = window.BitableTestTool;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const results = [];

    for (const item of rows) {
      let rowIdx = -1;
      for (let i = 0; i < 60; i++) {
        const n = tt.getCell(i, 1)?.[0]?.text || '';
        if (n.includes(item.keyword)) {
          rowIdx = i;
          break;
        }
      }
      if (rowIdx < 0) {
        for (let i = 0; i < 60; i++) {
          for (let c = 0; c < 8; c++) {
            const s = JSON.stringify(tt.getCell(i, c) || '');
            if (s.includes(item.keyword)) {
              rowIdx = i;
              break;
            }
          }
          if (rowIdx >= 0) break;
        }
      }
      if (rowIdx < 0) {
        results.push({ id: item.id, ok: false, err: 'no row' });
        continue;
      }

      tt.showCell(rowIdx, 6);
      await sleep(400);
      const rect = tt.getCellRect(rowIdx, 6);
      const canvas = document.querySelector('canvas');
      const cr = canvas.getBoundingClientRect();
      const cx = cr.left + rect.x + rect.width / 2;
      const cy = cr.top + rect.y + rect.height / 2;
      const tel = document.elementFromPoint(cx, cy) || canvas;
      tel.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy, view: window }));
      await sleep(200);
      tel.dispatchEvent(
        new MouseEvent('dblclick', { bubbles: true, clientX: cx, clientY: cy, detail: 2, view: window }),
      );
      await sleep(400);

      const ed = document.querySelector('[contenteditable=true]');
      if (!ed) {
        results.push({ id: item.id, ok: false, err: 'no editor' });
        continue;
      }
      ed.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, item.text);
      ed.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await sleep(200);

      // 点击 BUG状态列提交
      tt.showCell(rowIdx, 0);
      await sleep(300);
      const rect0 = tt.getCellRect(rowIdx, 0);
      const tel0 =
        document.elementFromPoint(
          cr.left + rect0.x + rect0.width / 2,
          cr.top + rect0.y + rect0.height / 2,
        ) || canvas;
      tel0.dispatchEvent(new MouseEvent('click', { bubbles: true, view: window }));
      await sleep(1200);
      results.push({ id: item.id, ok: true, rowIdx });
    }

    const token = 'NbhqbK5OfahIaOsA7nAc3uaonXb';
    const ids = rows.map((r) => r.id);
    const j = await (
      await fetch(
        `/space/api/v1/bitable/${token}/records?tableId=tblt71WCcW4LUngs&recordIds=${ids.join(',')}`,
        { credentials: 'include' },
      )
    ).json();
    const b64 = j.data.records;
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const ds = new DecompressionStream('gzip');
    const parsed = JSON.parse(await new Response(new Blob([bin]).stream().pipeThrough(ds)).text());
    const verified = ids.map((id) => ({
      id,
      saved: !!(parsed.recordMap?.[id]?.fldcgLPCQd?.value?.[0]?.text?.trim()),
    }));
    return { results, verified, tableRev: parsed.tableRev };
  }, items);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: process.env.CHROME_USER_DATA ? [`--user-data-dir=${process.env.CHROME_USER_DATA}`] : [],
  });
  const page = await browser.newPage();
  await page.goto(WIKI_URL, { waitUntil: 'networkidle2', timeout: 120000 });
  await waitForBitable(page);

  const { results, verified, tableRev } = await batchFillRemarks(page, ITEMS);
  console.log(JSON.stringify({ tableRev, results, verified }, null, 2));

  const failed = verified.filter((v) => !v.saved);
  await browser.close();
  if (failed.length) {
    console.error('Not saved:', failed);
    process.exit(1);
  }
  console.log('All remarks saved.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
