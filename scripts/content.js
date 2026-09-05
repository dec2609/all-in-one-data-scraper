// =========================================================================
// TỔNG ĐÀI TRUNG TÂM (content.js)
// Nhiệm vụ: Lắng nghe lệnh từ Lễ tân (popup.js) và gọi đúng tool ra chạy
// =========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`[Tổng đài] Nhận lệnh: ${request.action} cho nền tảng: ${request.platform}`);

    // ----- NHÓM LỆNH CỦA YOUTUBE -----
    if (request.platform === "youtube") {
        if (request.action === "START") yt_startScraping();
        else if (request.action === "STOP") yt_stopScraping();
        else if (request.action === "SCRAPE") yt_extractData(sendResponse);
    }
    
    // ----- NHÓM LỆNH CỦA FACEBOOK -----
    else if (request.platform === "facebook") {
        if (request.action === "START") fb_startScraping();
        else if (request.action === "STOP") fb_stopScraping();
        else if (request.action === "SCRAPE") fb_extractData(sendResponse);
    }

    // ----- NHÓM LỆNH CỦA REDDIT -----
    else if (request.platform === "reddit") {
        if (request.action === "START") rd_startScraping();
        else if (request.action === "STOP") rd_stopScraping();
        else if (request.action === "SCRAPE") rd_extractData(sendResponse);
    }
    
    // ----- NHÓM LỆNH CỦA TIKTOK -----
    else if (request.platform === "tiktok") {
        if (request.action === "START") tt_startScraping();
        else if (request.action === "STOP") tt_stopScraping();
        else if (request.action === "SCRAPE") tt_extractData(sendResponse);
        else if (request.action === "RESET") tt_resetData(sendResponse); // Đặc quyền dọn rác của TikTok
    }

    // ----- NHÓM LỆNH CỦA XENFORO -----
    else if (request.platform === "xenforo") {
        if (request.action === "SCRAPE_XENFORO") {
            // Truyền 2 con số nhận được từ ô nhập liệu thẳng vào hàm cào
            xf_scrapeChunk(request.startPage, request.endPage, sendResponse);
        }
    }

    // Bắt buộc return true để Chrome biết mình sẽ gửi phản hồi (sendResponse) dạng chờ đợi (bất đồng bộ)
    return true; 
});

// =========================================================================
// HÀM TIỆN ÍCH DÙNG CHUNG CỦA NHÀ MÁY
// =========================================================================

// Hàm xuất file TXT (Cả 5 ông tướng scraper kia đều gọi hàm này để tải file, khỏi cần viết lại 5 lần)
function downloadTxtFile(data, filename) {
    let blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}