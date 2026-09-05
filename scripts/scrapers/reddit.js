// Khai báo biến trạng thái riêng cho Reddit
let rd_isRunning = false;
let rd_scrapeInterval;

// Hàm phụ trợ: Bấm nút mở rộng comment
function rd_expandComments() {
    const buttons = document.querySelectorAll('button, shreddit-async-loader, [role="button"]');
    for (let btn of buttons) {
        const text = btn.textContent.toLowerCase().trim();
        const shouldClick = text.includes("more replies") || 
                            text.includes("more reply") || 
                            text.includes("view more comments") || 
                            text.includes("load more comments") || 
                            text.includes("more comments");

        if (shouldClick && text !== "reply") {
            try { btn.click(); } catch(e) {}
        }
    }
}

// 1. HÀM BẮT ĐẦU (Auto Click)
function rd_startScraping() {
    if (rd_isRunning) return;
    rd_isRunning = true;
    console.log("▶️ [Reddit] Đang tự động bung các bình luận...");
    
    // Chạy vòng lặp 1.5 giây 1 lần giống code gốc của ông
    rd_scrapeInterval = setInterval(rd_expandComments, 1500);
}

// 2. HÀM DỪNG LẠI
function rd_stopScraping() {
    rd_isRunning = false;
    clearInterval(rd_scrapeInterval);
    console.log("⏹️ [Reddit] Đã dừng tạm thời vòng lặp click.");
}

// 3. HÀM CÀO & XUẤT DỮ LIỆU
function rd_extractData(sendResponse) {
    if (rd_isRunning) {
        alert("Vui lòng bấm Stop trước khi cào nha!");
        sendResponse({status: "Lỗi: Chưa Stop Reddit"});
        return;
    }

    let resultTxt = "=== BÀI VIẾT REDDIT ===\n\n";

    const postTitle = document.querySelector('h1[slot="title"]');
    const postBody = document.querySelector('div[slot="text-body"]');
    const postVoteBlock = document.querySelector('shreddit-post');
    let postVote = postVoteBlock ? (postVoteBlock.getAttribute('score') || "0") : "0";

    if (postTitle) resultTxt += `[Vote: ${postVote}] ` + postTitle.textContent.trim() + "\n";
    if (postBody) resultTxt += postBody.textContent.trim().replace(/\n+/g, " ") + "\n";
    resultTxt += "\n=== BÌNH LUẬN ===\n\n";

    const comments = document.querySelectorAll('shreddit-comment');
    let commentTree = [];
    let seen = new Set();
    let depthCounters = [];

    if (comments.length > 0) {
        comments.forEach(c => {
            let author = c.getAttribute('author') || "[deleted]";
            let score = c.getAttribute('score');
            if (!score || score === "0") score = "Vote";

            let depth = parseInt(c.getAttribute('depth') || "0");
            depthCounters.splice(depth + 1);

            if (!depthCounters[depth]) {
                depthCounters[depth] = 1;
            } else {
                depthCounters[depth]++;
            }

            let prefix = depthCounters.slice(0, depth + 1).join('.') + '. ';
            let contentBlock = c.querySelector('[slot="comment"]');
            let text = "";
            
            if (contentBlock) {
                let pTags = contentBlock.querySelectorAll('p');
                if (pTags.length > 0) {
                    let parts = [];
                    pTags.forEach(p => parts.push(p.textContent.trim()));
                    text = parts.join(" - ");
                } else {
                    text = contentBlock.textContent.trim().replace(/\n+/g, " ");
                }
            }

            let finalStr = `${prefix}[${author} | ⬆ ${score}]: ${text}`;

            if (text && !seen.has(finalStr)) {
                seen.add(finalStr);
                commentTree.push(finalStr);
            }
        });
    } else {
        resultTxt += "(Không tìm thấy cấu trúc web chuẩn của bản Reddit này!)\n";
    }

    resultTxt += commentTree.join("\n");
    
    // Gọi hàm dùng chung
    downloadTxtFile(resultTxt, `reddit_scrapper_${Date.now()}.txt`);
    sendResponse({status: `✅ Đã tải xong bài Reddit!`});
}