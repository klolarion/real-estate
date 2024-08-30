
const express = require('express');
const axios = require('axios');
const path = require('path'); // 경로 모듈 추가
const app = express();
const port = 3000;

// 예시: 환경 변수로부터 API 키를 가져오기
const apiKey = process.env.API_KEY;

// 요청을 처리하기 위해 정적 파일 제공
app.use(express.static('public'));
app.use(express.json());

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})

// 오픈 API 키와 기본 URL
const KEY = apiKey; // 실제 API 키로 대체
const TYPE = 'json';
const SERVICE = 'tbLnOpendataRtmsV';
const START_INDEX = 1;
const END_INDEX = 1000;

// 서초구 코드 매핑 예제
const CGG_CODES = {
	"종로구": "11110",
	"중구": "11140",
	"용산구": "11170",
	"성동구": "11200",
	"광진구": "11215",
	"동대문구": "11230",
	"중랑구": "11260",
	"성북구": "11290",
	"강북구": "11305",
	"도봉구": "11320",
	"노원구": "11350",
	"은평구": "11380",
	"서대문구": "11410",
	"마포구": "11440",
	"양천구": "11470",
	"강서구": "11500",
	"구로구": "11530",
	"금천구": "11545",
	"영등포구": "11560",
	"동작구": "11590",
	"관악구": "11620",
	"서초구": "11650",
	"강남구": "11680",
	"송파구": "11710",
	"강동구": "11740"
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

// API 요청 처리 엔드포인트
app.post('/api/realestate', async (req, res) => {
    try {
        const { CGG_NM, RCPT_YR, STDG_CD, LOTNO_SE, MNO, SNO, BLDG_NM, CTRT_DAY, BLDG_USG } = req.body;

        // CGG_NM을 통해 CGG_CD 매핑
        const CGG_CD = CGG_CODES[CGG_NM];
        if (!CGG_CD) {
            return res.status(400).json({ error: 'Invalid district name.' });
        }

        // 오픈 API URL 구성
        const baseUrl = 'http://openapi.seoul.go.kr:8088';
        const url = `${baseUrl}/${KEY}/${TYPE}/${SERVICE}/${START_INDEX}/${END_INDEX}/${RCPT_YR}/${CGG_CD}/${CGG_NM}/${STDG_CD || ''}/${LOTNO_SE || ''}/${MNO || ''}/${SNO || ''}/${BLDG_NM || ''}/${CTRT_DAY || ''}/${BLDG_USG || ''}`;

        // 오픈 API에 요청
        const response = await axios.get(url);
        const data = response.data;

        // API 응답 형식에 맞춰 데이터 추출
        if (data.tbLnOpendataRtmsV.RESULT.CODE !== 'INFO-000') {
            return res.status(500).json({ error: 'Failed to fetch data from API.' });
        }



        // 결과 목록을 반환
        const results = data.tbLnOpendataRtmsV.row;
        res.json(results);
         } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
            }

    // 금액을 한국어 표기 형식으로 변환하는 함수
function convertToKoreanWonFormat(amountStr) {
    // 입력된 금액에서 숫자만 추출
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);

    // 억 단위와 천 단위를 계산
    const billions = Math.floor(amount / 10000); // 억 단위
    const thousands = Math.floor((amount % 10000) / 1000); // 천 단위

    // 결과 문자열 생성
    let formatted = '';
    if (billions > 0) {
        formatted += `${billions}억`;
    }
    if (thousands > 0) {
        formatted += ` ${thousands}천`;
    }
    formatted += '만원';

    return formatted.trim();
}

            // 장바구니에 항목 추가 함수
function addToCart(item) {
    const cartList = document.getElementById('cart-list');
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.textContent = `${item.BLDG_NM}: ${convertToKoreanWonFormat(item.THING_AMT)}`;

    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger btn-sm';
    removeButton.textContent = '취소';
    removeButton.addEventListener('click', () => {
        li.remove(); // 장바구니에서 항목 제거
        updateCartMessage(); // 항목 제거 후 메시지 업데이트
        saveCartToLocalStorage(); // 항목 제거 후 로컬 스토리지 업데이트
    });

    li.appendChild(removeButton);
    cartList.appendChild(li);

    updateCartMessage(); // 항목 추가 후 메시지 업데이트
    saveCartToLocalStorage(); // 항목 추가 후 로컬 스토리지 업데이트
}

    
            function renderCartList() {
                const cartList = JSON.parse(localStorage.getItem('관심목록')) || [];
                const cartListElement = document.getElementById('cart-list');
                cartListElement.innerHTML = '';
    
                cartList.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.textContent = `${item.RCPT_YR}년 ${item.CTRT_DAY} - ${item.CGG_NM} ${item.STDG_NM} ${item.BLDG_NM}: ${item.THING_AMT}만원`;
    
                    const removeButton = document.createElement('button');
                    removeButton.className = 'btn btn-danger btn-sm';
                    removeButton.textContent = '취소';
                    removeButton.addEventListener('click', () => {
                        removeFromCart(index);
                    });
    
                    li.appendChild(removeButton);
                    cartListElement.appendChild(li);
                });
            }
    
            function removeFromCart(index) {
                const cartList = JSON.parse(localStorage.getItem('관심목록')) || [];
                cartList.splice(index, 1); // 지정된 인덱스의 아이템 제거
                localStorage.setItem('관심목록', JSON.stringify(cartList)); // 업데이트된 목록 저장
                renderCartList(); // UI 업데이트
            }
    
            // 페이지 로드 시 장바구니 리스트 렌더링
            // document.addEventListener('DOMContentLoaded', renderCartList);
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

