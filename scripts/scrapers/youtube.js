// Khai báo biến trạng thái riêng cho YouTube
let yt_isExpanding = false;

// 1. HÀM BẮT ĐẦU (Auto Click)
async function yt_startScraping() {
    if (yt_isExpanding) return;
    yt_isExpanding = true;
    console.log("▶️ [YT] Đang dò tìm phản hồi...");

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    while (yt_isExpanding) {
        let clickedAny = false;
        let buttons = document.querySelectorAll('button, tp-yt-paper-button, #more-replies, #more-replies .yt-spec-button-shape-next');

        for(let btn of buttons) {
            let txt = btn.innerText ? btn.innerText.toLowerCase().trim() : "";
            if (txt === "phản hồi" || txt === "reply" || txt.includes("ẩn") || txt.includes("hide") || txt.includes("thu gọn")) continue;

            if(txt.includes("phản hồi") || txt.includes("đọc thêm") || txt.includes("hiện thêm") || txt.includes("read more") || txt.includes("replies") || txt.includes("show more")) {
                if(btn.offsetWidth > 0 && btn.offsetHeight > 0) {
                    try { btn.click(); clickedAny = true; } catch(e) {}
                }
            }
        }
        await sleep(clickedAny ? 1500 : 1000);
    }
}

// 2. HÀM DỪNG LẠI
function yt_stopScraping() {
    yt_isExpanding = false;
    console.log("⏹️ [YT] Đã dừng vòng lặp click.");
}

// 3. HÀM CÀO & XUẤT DỮ LIỆU
function yt_extractData(sendResponse) {
    if (yt_isExpanding) {
        alert("Nhớ bấm Stop trước khi cào nha ông!");
        sendResponse({status: "Lỗi: Chưa Stop"});
        return;
    }

    let comments = Array.from(document.querySelectorAll('ytd-comment-renderer, ytd-comment-view-model'));
    if(comments.length === 0) {
        alert("Không tìm thấy comment, thử F5 lại nhé!");
        sendResponse({status: "Lỗi: Không thấy comment"});
        return;
    }

    let videoTitleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    let videoTitle = videoTitleEl ? videoTitleEl.innerText.trim() : "Video không xác định";

    let output = "========== YOUTUBE SCRAPPER ==========\n";
    output += `[VIDEO TITLE] ${videoTitle}\n`;
    output += "----------------- BÌNH LUẬN -----------------\n\n";

    let countLevel1 = 0, countLevel2 = 0;
    let baselineX = -1;

    comments.forEach((comment) => {
        let userEl = comment.querySelector('#author-text, #author-name, .ytd-channel-name, a.yt-simple-endpoint > span');
        let userName = userEl ? userEl.innerText.trim() : "Người dùng ẩn";

        let contentEl = comment.querySelector('#content-text, yt-attributed-string#content-text, #content .yt-core-attributed-string');
        let contentText = contentEl ? contentEl.innerText.trim() : "";

        if (!contentText) return;

        let rect = comment.getBoundingClientRect();
        let currentX = Math.round(rect.left);
        if (baselineX === -1) baselineX = currentX;

        let numbering = "";
        if (Math.abs(currentX - baselineX) < 20) {
            countLevel1++; countLevel2 = 0; numbering = `${countLevel1}.`;
        } else {
            if (countLevel1 === 0) countLevel1 = 1;
            countLevel2++; numbering = `${countLevel1}.${countLevel2}.`;
        }
        output += `${numbering} [${userName}]: ${contentText.replace(/\n/g, ' ')}\n`;
    });

    // Xuất file dùng hàm xài chung ở content.js
    downloadTxtFile(output, `youtube_scrapper_${Date.now()}.txt`);
    
    // Báo cáo về cho UI
    sendResponse({status: `✅ Cào thành công ${comments.length} comment!`});
}