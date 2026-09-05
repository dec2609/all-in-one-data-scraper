// Khai báo biến trạng thái cho Facebook
let fb_isExpanding = false;

// 1. HÀM BẮT ĐẦU (Auto Click mở rộng comment)
async function fb_startScraping() {
    if (fb_isExpanding) return;
    fb_isExpanding = true;
    console.log("▶️ [FB] Đang dò và mở rộng bình luận...");

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    while (fb_isExpanding) {
        let clickedAny = false;
        let elements = document.querySelectorAll('div[role="button"], span');

        for(let el of elements) {
            let txt = el.innerText ? el.innerText.toLowerCase() : "";
            if(txt === "xem thêm" || txt.includes("phản hồi") || txt.includes("đã ẩn") || txt.includes("các bình luận") || txt.includes("xem thêm bình luận") ) {
                if(el.offsetWidth > 0 && el.offsetHeight > 0) {
                    try { el.click(); clickedAny = true; } catch(e) {}
                }
            }
        }
        await sleep(clickedAny ? 1500 : 1000);
    }
}

// 2. HÀM DỪNG LẠI
function fb_stopScraping() {
    fb_isExpanding = false;
    console.log("⏹️ [FB] Đã dừng vòng lặp click.");
}

// 3. HÀM CÀO & XUẤT DỮ LIỆU
function fb_extractData(sendResponse) {
    if (fb_isExpanding) {
        alert("Vui lòng bấm Stop trước khi cào!");
        sendResponse({status: "Lỗi: Chưa Stop FB"});
        return;
    }

    let articles = Array.from(document.querySelectorAll('div[role="article"]'));
    if(articles.length === 0) {
        alert("Lỗi: Không tìm thấy bài viết/bình luận.");
        sendResponse({status: "Lỗi: Không thấy data"});
        return;
    }

    let output = "========== FACEBOOK SCRAPPER ==========\n\n";
    let countLevel1 = 0, countLevel2 = 0, countLevel3 = 0;
    let baselineX = -1;

    articles.forEach((article, index) => {
        let userEl = article.querySelector('h2, h3, strong, a[role="link"] > span[dir="auto"]');
        let userName = userEl ? userEl.innerText.trim() : "Người dùng ẩn/Lỗi tên";

        let contentEls = article.querySelectorAll('div[dir="auto"]');
        let contentText = "";

        contentEls.forEach(c => {
            let text = c.innerText.trim();
            if(text && text !== userName && !["Thích", "Phản hồi", "Chia sẻ", "Theo dõi"].includes(text) && !text.match(/^[0-9]+ (phút|giờ|ngày|tuần|tháng|năm)/)) {
                contentText += text + " ";
            }
        });

        if (index === 0) {
            output += `[CHỦ TÚT] ${userName}\n[CAPTION] ${contentText.trim()}\n\n----------------- BÌNH LUẬN -----------------\n\n`;
            return;
        }

        let rect = article.getBoundingClientRect();
        let currentX = Math.round(rect.left);
        if (baselineX === -1) baselineX = currentX;

        let numbering = "";
        if (Math.abs(currentX - baselineX) < 15) {
            countLevel1++; countLevel2 = 0; countLevel3 = 0; numbering = `${countLevel1}.`;
        } else if (currentX > baselineX + 15 && currentX < baselineX + 65) {
            if (countLevel1 === 0) countLevel1 = 1;
            countLevel2++; countLevel3 = 0; numbering = `${countLevel1}.${countLevel2}.`;
        } else if (currentX >= baselineX + 65) {
            if (countLevel2 === 0) countLevel2 = 1;
            countLevel3++; numbering = `${countLevel1}.${countLevel2}.${countLevel3}.`;
        }
        output += `${numbering} [${userName}]: ${contentText.trim()}\n`;
    });

    // Gọi hàm dùng chung ở content.js để tải file
    downloadTxtFile(output, `facebook_scrapper_${Date.now()}.txt`);
    sendResponse({status: `✅ Cào thành công bài viết FB!`});
}