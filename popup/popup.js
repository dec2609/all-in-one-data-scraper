document.addEventListener("DOMContentLoaded", () => {
    // 1. Tham chiếu các thành phần UI từ HTML
    const uiStandard = document.getElementById("ui-standard");
    const uiXenforo = document.getElementById("ui-xenforo");
    const uiUnsupported = document.getElementById("ui-unsupported");
    const statusText = document.getElementById("status-text");
    const platformLogo = document.getElementById("platform-logo");

    // 2. Nhận diện tab hiện tại đang mở web gì
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let currentUrl = tabs[0].url.toLowerCase();
        let currentTabId = tabs[0].id;
        let platform = "unsupported";

        // Logic phân loại (Bạn có thể thêm các đuôi tên miền forum vào chỗ xenforo)
        if (currentUrl.includes("facebook.com")) platform = "facebook";
        else if (currentUrl.includes("youtube.com")) platform = "youtube";
        else if (currentUrl.includes("reddit.com")) platform = "reddit";
        else if (currentUrl.includes("tiktok.com")) platform = "tiktok";
        // Nhận diện các diễn đàn (ví dụ: xamvn, voz, hoặc có chữ forum)
        else if (currentUrl.includes("xam") || currentUrl.includes("voz") || currentUrl.includes("forum")) platform = "xenforo";

        // 3. Cập nhật giao diện (Giấu hết đi, chỉ mở cái cần thiết)
        uiStandard.classList.add("hidden");
        uiXenforo.classList.add("hidden");
        uiUnsupported.classList.add("hidden");

        if (["facebook", "youtube", "reddit", "tiktok"].includes(platform)) {
            // Mở ngăn Standard
            uiStandard.classList.remove("hidden");
            platformLogo.innerText = `🌐 Đang cào: ${platform.toUpperCase()}`;
            statusText.innerText = "Sẵn sàng hoạt động!";
            
            // Gắn sự kiện GỬI LỆNH cho các nút Standard
            document.getElementById("btn-start").onclick = () => sendMessage(currentTabId, { action: "START", platform: platform });
            document.getElementById("btn-stop").onclick = () => sendMessage(currentTabId, { action: "STOP", platform: platform });
            document.getElementById("btn-scrape").onclick = () => sendMessage(currentTabId, { action: "SCRAPE", platform: platform });
            
        } else if (platform === "xenforo") {
            // Mở ngăn XenForo
            uiXenforo.classList.remove("hidden");
            statusText.innerText = "Sẵn sàng quét Forum!";
            
            // Đặc biệt với XenForo: Lấy thêm 2 con số Trang Bắt Đầu và Kết Thúc để gửi đi
            document.getElementById("btn-scrape-xen").onclick = () => {
                let start = document.getElementById("xen-start").value;
                let end = document.getElementById("xen-end").value;
                sendMessage(currentTabId, { 
                    action: "SCRAPE_XENFORO", 
                    platform: "xenforo", 
                    startPage: start, 
                    endPage: end 
                });
            };
        } else {
            // Báo lỗi nếu vào nhầm web
            uiUnsupported.classList.remove("hidden");
            statusText.innerText = "Chưa hỗ trợ trang này.";
        }

        // Gắn sự kiện cho nút Dọn rác chung
        document.getElementById("btn-reset").onclick = () => sendMessage(currentTabId, { action: "RESET" });
    });

    // 4. HÀM CHUYÊN CHỞ TIN NHẮN (Gửi lệnh từ Lễ tân xuống Nhà máy)
    function sendMessage(tabId, message) {
        statusText.innerText = "Đang gửi lệnh...";
        chrome.tabs.sendMessage(tabId, message, (response) => {
            // Xử lý báo lỗi nếu Nhà máy (content.js) chưa sẵn sàng
            if (chrome.runtime.lastError) {
                statusText.innerText = "Lỗi: Hãy F5 lại trang web để kết nối!";
                console.error(chrome.runtime.lastError);
            } else if (response && response.status) {
                statusText.innerText = response.status;
            }
        });
    }
});