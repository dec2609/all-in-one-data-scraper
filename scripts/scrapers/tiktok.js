// Khai báo biến toàn cục riêng cho TikTok
let tt_comments = new Map();
let tt_isPaused = true; 
let tt_scraperInterval = null;
let tt_parentIndex = 0;
let tt_childIndex = 0;

// Hàm phụ trợ: Tìm khung cuộn của TikTok
function tt_getScrollableContainer() {
    let blocks = document.querySelectorAll('div[class*="DivCommentItemContainer"], div[class*="CommentItem"]');
    if (blocks.length === 0) return window;
    let parent = blocks[0].parentElement;
    while (parent && parent !== document.body) {
        let style = window.getComputedStyle(parent);
        if (style.overflowY === 'scroll' || style.overflowY === 'auto') return parent;
        parent = parent.parentElement;
    }
    return window;
}

// Hàm cốt lõi: Quét và thu thập dữ liệu (Chạy lặp lại)
function tt_scrapeStep() {
    if (tt_isPaused) return;

    let buttons = document.querySelectorAll('p, span, div');
    let isOpeningReplies = false;

    buttons.forEach(el => {
        let text = el.innerText;
        if (text && text.includes("Xem") && (text.includes("thêm") || text.includes("câu trả lời")) && !text.includes("Ẩn") && text.length < 50) {
            el.click(); isOpeningReplies = true; 
        }
    });

    if (isOpeningReplies) return; // Đang chờ mở comment con thì chưa quét vội

    let blocks = document.querySelectorAll('div[class*="DivCommentItemContainer"]:not([data-da-cao="true"]), div[class*="CommentItem"]:not([data-da-cao="true"]), div[class*="DivCommentContentContainer"]:not([data-da-cao="true"])');
    
    blocks.forEach(block => {
        let textNode = block.querySelector('p[class*="CommentText"], [data-e2e="comment-level-1"], [data-e2e="comment-level-2"]');
        let timeNode = block.querySelector('span[data-e2e="comment-time-1"], span[data-e2e="comment-time-2"], span[class*="SpanTime"], span[class*="Time"]');
        let linkNodes = block.querySelectorAll('a[href*="/@"]'); 
        
        if (textNode) {
            let text = textNode.innerText.trim();
            let username = "";
            let time = timeNode ? timeNode.innerText.trim() : "N/A";
            
            for(let node of linkNodes) {
                let nodeText = node.innerText.trim();
                if(nodeText) { username = nodeText; break; }
            }
            if (!username) username = "User_Bi_An";
            
            if(text) {
                let isChild = block.innerHTML.includes('comment-level-2') || textNode.getAttribute('data-e2e') === 'comment-level-2';
                let numberPrefix = "";

                if (!isChild) {
                    tt_parentIndex++; tt_childIndex = 0; numberPrefix = `[${tt_parentIndex}]`;
                } else {
                    tt_childIndex++; numberPrefix = `[${tt_parentIndex}.${tt_childIndex}]`;
                }

                let displayFormat = `${numberPrefix} ${username} (${time}): ${text}`;
                tt_comments.set(username + "|||" + text, displayFormat);
                
                block.setAttribute('data-da-cao', 'true'); // Đánh dấu đã cào
            }
        }
    });

    // Tự động cuộn chuột
    let scrollContainer = tt_getScrollableContainer();
    if(scrollContainer === window) window.scrollBy(0, 300); 
    else scrollContainer.scrollTop += 300;
}

// 1. HÀM BẮT ĐẦU (Khởi động động cơ)
function tt_startScraping() {
    if (!tt_isPaused) return;
    tt_isPaused = false;
    console.log("▶️ [TikTok] Đang khởi động động cơ cào...");
    
    if (!tt_scraperInterval) {
        tt_scraperInterval = setInterval(tt_scrapeStep, 700);
    }
}

// 2. HÀM DỪNG LẠI
function tt_stopScraping() {
    tt_isPaused = true;
    clearInterval(tt_scraperInterval);
    tt_scraperInterval = null;
    console.log("⏹️ [TikTok] Đã tạm dừng. Có thể tải file.");
}

// 3. HÀM CÀO & XUẤT DỮ LIỆU
function tt_extractData(sendResponse) {
    if (tt_comments.size === 0) {
        alert("Chưa lụm được bình luận nào! Bấm BẮT ĐẦU trước đi.");
        sendResponse({status: "Lỗi: Data rỗng"});
        return;
    }

    tt_stopScraping(); // Tự động dừng nếu người dùng quên

    let txtContent = "--- DANH SÁCH COMMENT TIKTOK (AUTO UI) ---\n\n";
    tt_comments.forEach(formattedText => {
        if (formattedText.includes("[") && !formattedText.includes(".")) {
            txtContent += `${formattedText}\n\n`; 
        } else {
            txtContent += `    ↳ ${formattedText}\n\n`; 
        }
    });

    downloadTxtFile(txtContent, `TikTok_Comments_${Date.now()}.txt`);
    sendResponse({status: `✅ Đã lưu ${tt_comments.size} comment TikTok!`});
}

// 4. HÀM DỌN DẸP (Nút Reset)
function tt_resetData(sendResponse) {
    tt_stopScraping();
    tt_comments.clear();
    tt_parentIndex = 0;
    tt_childIndex = 0;
    
    document.querySelectorAll('[data-da-cao="true"]').forEach(el => el.removeAttribute('data-da-cao'));
    
    console.log("🧹 [TikTok] Đã dọn sạch bộ nhớ.");
    sendResponse({status: "✅ Đã dọn sạch data cũ, sẵn sàng video mới!"});
}