const defaultOptions = {duration: 4000, showClose: true, showProgress: true, position: 'top-right'},
    iconMap = {
        success: '<i class="fas fa-check"></i>',
        error: '<i class="fa fa-times"></i>',
        warning: '<i class="fa fa-exclamation-triangle"></i>',
        info: '<i class="fa fa-exclamation-circle"></i>'
    };

function createToast(type, title, message, options) {
    const opts = $.extend({}, defaultOptions, options);
    const toastId = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const toastHtml = `<div class="toast ${type}"id="${toastId}"><div class="toast-icon">${iconMap[type] || iconMap.info}</div><div class="toast-content">${title ? `<div class="toast-title">${title}</div>` : ''}<div class="toast-message">${message}</div></div>${opts.showClose ? '<button class="toast-close" onclick="closeToast(\'' + toastId + '\')">&times;</button>' : ''}${opts.showProgress ? `<div class="toast-progress"style="animation-duration: ${opts.duration}ms;"></div>` : ''}</div>`;
    return {id: toastId, html: toastHtml, duration: opts.duration}
}

function toast(type, title, message, options) {
    const toast = createToast(type, title, message, options);
    const container = $('#toastContainer');
    if (container.length === 0) {
        $('body').append('<div class="toast-container" id="toastContainer"></div>');
    }
    $('#toastContainer').append(toast.html);
    const _toast = $('#' + toast.id);
    setTimeout(() => {
        _toast.addClass('show');
    }, 10);
    if (toast.duration > 0) {
        setTimeout(() => {
            closeToast(toast.id);
        }, toast.duration);
    }
    return toast.id;
}

window.closeToast = function (toastId) {
    const toast = $('#' + toastId);
    if (toast.length) {
        toast.removeClass('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
};

function isValidEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 动态添加模态框到页面
const modalHTML = `
	<div class="modal-overlay" id="purchaseModal">
		   <div class="modal-content">
			   <div class="modal-header">
				   <h3 class="modal-title"><i class="fas fa-shopping-bag"></i> 确认订单信息</h3>
				   <button class="close-btn close-modal-btn">×</button>
			   </div>
	
			   <div class="modal-body">
				   <div class="_order-info">
					   <!-- 倒计时 -->
					   <div class="countdown-section">
						   <div class="countdown-title"><i class="fas fa-clock"></i> 请在规定时间内完成支付</div>
						   <div class="countdown-timer" id="countdownTimer">15:00</div>
						   <div class="countdown-hint">订单将在倒计时结束后自动取消</div>
					   </div>
	
					   <!-- 订单摘要 -->
					   <div class="order-summary">
						   <h4 class="summary-title"><i class="fas fa-clipboard-list"></i> 订单详情</h4>
						   <div class="summary-row">
							   <span class="summary-value" id="product_name">-</span>
						   </div>
						   <div class="summary-row">
							   <span class="summary-label">收件邮箱</span>
							   <span class="summary-value" id="summaryEmail">-</span>
						   </div>
						   <div class="summary-row summary-row-clear-bt">
							   <span class="summary-label">支付方式</span>
							   <span class="summary-value" id="summaryPayment">-</span>
						   </div>
						   <div class="summary-row">
							   <span class="summary-label">应付总额</span>
							   <span class="summary-value total" id="summaryTotal">-</span>
						   </div>
					   </div>
				   </div>
	
				   <!-- 支付信息 -->
				   <div class="payment-section">
					   <h4 class="payment-title"><i class="fas fa-money-bill-wave"></i> 支付信息</h4>
					   <div class="address-section">
						   <div class="address-label"><i class="fas fa-wallet"></i> 收款地址</div>
						   <div class="address-value" id="usdtAddress"></div>
						   <button class="copy-btn" data-clipboard-text=""><i class="far fa-copy"></i> 复制</button>
					   </div>
					   <div class="qr-section">
						   <div class="qr-code" id="qr-code"><i class="fas fa-qrcode fa-3x"></i></div>
						   <p style="color: #64748b; font-size: 14px;">请使用支持 <span>USDT-TRC20</span> 的钱包扫码支付</p>
					   </div>
				   </div>
			   </div>
		   </div>
	</div>
	`;

if(window.location.href.indexOf('/detail/') !== -1) {
    $('body').append(modalHTML);
}

// 获取动态添加的元素
const purchaseModal = $('#purchaseModal');
const $closeModalBtn = $('.close-modal-btn');
const $copyBtn = $('.copy-btn');

// 数量选择器功能
const $quantityInput = $('#quantity');
const $subtractBtn = $('.quantity-btn.subtract');
const $increaseBtn = $('.quantity-btn.increase');
const $totalPriceElement = $('#totalPrice'),
    productName = $('.product-d-title').text(),
    basePrice = parseFloat($totalPriceElement.data('price'));

function updateTotalPrice() {
    const quantity = parseInt($quantityInput.val());
    const totalPrice = (basePrice * quantity).toFixed(2);
    $totalPriceElement.text('$' + totalPrice);
}

$subtractBtn.on('click', function() {
    let currentValue = parseInt($quantityInput.val());
    if (currentValue > 1) {
        $quantityInput.val(currentValue - 1);
        updateTotalPrice();
    }
});

$increaseBtn.on('click', function() {
    let currentValue = parseInt($quantityInput.val());
    if (currentValue < 1000) {
        $quantityInput.val(currentValue + 1);
        updateTotalPrice();
    }
});

$quantityInput.on('input', function() {
    let value = parseInt($(this).val());
    if (value < 1) $(this).val(1);
    if (value > 1000) $(this).val(1000);
    updateTotalPrice();
});

// 支付方式选择
const $paymentMethods = $('.payment-method');

$paymentMethods.on('click', function() {
    $paymentMethods.removeClass('selected');
    $(this).addClass('selected');
});

// 购买按钮点击事件
const $buyBtn = $('#buyBtn');

// 添加倒计时计时器变量
let countdownInterval = null;

$buyBtn.on('click', function() {
    const email = $('#email').val();
    const quantity = $('#quantity').val();
    const selectedPayment = $('.payment-method.selected .payment-text').text();
    if(!email || !isValidEmail(email)){
        $('#email').focus();
        toast('error', '', '请输入正确的邮箱地址');
        return;
    }

    // 更新模态框中的信息
    $('#product_name').text(productName);
    $('#summaryEmail').text(email);
    $('#summaryQuantity').text(quantity);
    $('#summaryPrice').text('$' + basePrice.toFixed(2));
    $('#summaryPayment').text(selectedPayment);
    $('#summaryTotal').text('$' + (basePrice * quantity).toFixed(2));

    const _addr = [
        ['USDT-TRC20', 'TCoh51KyRGUhK2kZkJqy3eKMYmXvbdRSd2'],
        ['USDT-ERC20', '0x127b36f4528a4b66420bf76cE29B8d14DFBcFeCa'],
        ['USDT-BEP20', '0x127b36f4528a4b66420bf76cE29B8d14DFBcFeCa'],
        ['USDT-Solana', 'Gy3BhL8h3NmRNVa3rP4Q6ShMZ3pqmU3TPWMCj2BFpCW6']
    ];

    const found = _addr.find(item => item[0] === selectedPayment);
    $('#usdtAddress').text(found[1]);
    $('.qr-section span').text(selectedPayment);
    $copyBtn.attr('data-clipboard-text', found[1]);
    $('#qr-code').empty();

    const qrCode = new QRCodeStyling({
        width: 200,
        height: 200,
        type: "canvas",
        data: found[1],
        image: '/static/jmvanek/img/'+ selectedPayment.toLowerCase() +'.png',
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 5,
            imageSize: 0.3,
            hideBackgroundDots: true
        }
    });

    document.getElementById('qr-code').innerHTML = '';
    qrCode.append(document.getElementById("qr-code"));

    // 显示模态框
    purchaseModal.addClass('active');

    // 开始倒计时
    startCountdown();

    toast('success', '', '订单创建成功');
});

// 关闭模态框
$closeModalBtn.on('click', function() {
    purchaseModal.removeClass('active');
    // 关闭模态框时清除计时器
    clearCountdown();
});

// 点击模态框外部关闭
purchaseModal.on('click', function(e) {
    if (e.target === this) {
        purchaseModal.removeClass('active');
        // 关闭模态框时清除计时器
        clearCountdown();
    }
});

// 复制地址功能
$copyBtn.click(function() {
    if(typeof ClipboardJS !== 'undefined'){
        var clipboard = new ClipboardJS('.copy-btn');
        clipboard.on('success', function (e) {
            $copyBtn.html('<i class="fas fa-check"></i> 已复制');
            $copyBtn.addClass('copied');
            setTimeout(function() {
                $copyBtn.html('<i class="far fa-copy"></i> 复制');
                $copyBtn.removeClass('copied');
            }, 2000);
            e.clearSelection();
        });
    }
});

// 倒计时功能
function startCountdown() {
    // 清除之前的计时器
    clearCountdown();

    let timeLeft = 15 * 60; // 15分钟
    const $countdownTimer = $('#countdownTimer');
    $countdownTimer.removeClass('warning'); // 重置警告状态

    // 创建新的计时器
    countdownInterval = setInterval(function() {
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            purchaseModal.removeClass('active');
            alert('支付时间已到，订单已取消');
            return;
        }

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        $countdownTimer.text(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

        if (timeLeft <= 60) {
            $countdownTimer.addClass('warning');
        }

        timeLeft--;
    }, 1000);
}

// 清除倒计时函数
function clearCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

// 页面卸载时清理计时器
$(window).on('beforeunload', function() {
    clearCountdown();
});

$(document).ready(function(){$('.filter-btn').click(function(){var cat=$(this).data('category');$('.filter-btn').removeClass('active');$(this).addClass('active');if(cat=='all'){$('.product-card').show();}else{$('.product-card').hide();$('.product-card.cid-'+cat).show();}});$('.faq-question').click(function(){$(this).parent('.faq-item').toggleClass('active');});$('#mobileMenuBtn').click(function(){$('#mainNav').toggleClass('active');});$(document).click(function(event){if(!$(event.target).closest('#mainNav, #mobileMenuBtn').length){$('#mainNav').removeClass('active');}});$('.faq-item:first').addClass('active');});