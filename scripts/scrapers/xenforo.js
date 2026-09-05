// Hàm cào XenForo nhận thẳng số trang từ Lễ tân truyền xuống
async function xf_scrapeChunk(startPageInput, endPageInput, sendResponse) {
    let startPage = parseInt(startPageInput);
    let endPage = parseInt(endPageInput);

    if (isNaN(startPage) || isNaN(endPage) || startPage > endPage || startPage < 1) {
        alert("❌ Số trang nhập vào không hợp lệ nha! Trang bắt đầu phải nhỏ hơn hoặc bằng trang kết thúc.");
        sendResponse({status: "Lỗi: Nhập sai số trang"});
        return;
    }

    let baseUrl = window.location.href.split('/page-')[0];
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    let allText = `=== DỮ LIỆU CÀO TỪ TRANG ${startPage} ĐẾN TRANG ${endPage} === \n\n`;
    console.log(`🚀 Nhận lệnh! Bắt đầu cào từ trang ${startPage} đến ${endPage}...`);
    
    // Phản hồi liền cho UI biết để nó đổi chữ thành "Đang cào..."
    sendResponse({status: `Đang cào từ trang ${startPage} đến ${endPage}... Xem F12 để biết tiến độ!`});

    for (let i = startPage; i <= endPage; i++) {
        console.log(`⏳ Đang xử lý trang ${i}/${endPage}...`);
        try {
            let url = (i === 1) ? baseUrl : `${baseUrl}page-${i}`;
            let response = await fetch(url);

            if (!response.ok) {
                console.warn(`⚠️ Lỗi tải trang ${i} (Mã lỗi: ${response.status}). Phanh lại!`);
                break;
            }

            let html = await response.text();
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');

            let posts = doc.querySelectorAll('article.message, .message');

            if (posts.length === 0) {
                console.warn(`⚠️ Trang ${i} trống không. Dừng thôi.`);
                break;
            }

            posts.forEach((post) => {
                let authorEl = post.querySelector('.username');
                let author = authorEl ? authorEl.textContent.trim() : 'Ẩn danh';
                let contentEl = post.querySelector('.bbWrapper');
                let content = contentEl ? contentEl.innerText.trim() : 'Không có nội dung';

                allText += `[👤 Tác giả]: ${author}\n`;
                allText += `[📝 Nội dung]:\n${content}\n`;
                allText += `--------------------------------------------------\n\n`;
            });

            // Delay né bị block
            if (i < endPage) {
                let delay = Math.floor(Math.random() * 1500) + 2000;
                await new Promise(r => setTimeout(r, delay));
            }

        } catch (error) {
            console.error(`❌ Lỗi hệ thống chập mạch ở trang ${i}:`, error);
            break;
        }
    }

    // Tự động tải file
    downloadTxtFile(allText, `XenForo_p${startPage}_den_p${endPage}.txt`);
    alert("🎉 Hoàn tất cào XenForo! Đã xuất file.");
}