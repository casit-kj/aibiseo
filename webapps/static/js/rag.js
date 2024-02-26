const format = (text) => {
    return text.replace(/(?:\r\n|\r|\n)/g, "<br>");
};

function resizeTextarea(textarea) {
    textarea.style.height = '80px';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

/**
 * 아이디 생성
 * @returns {string}
 */
const message_id = () => {
    random_bytes = (Math.floor(Math.random() * 1338377565) + 2956589730).toString(
        2
    );
    unix = Math.floor(Date.now() / 1000).toString(2);

    return BigInt(`0b${unix}${random_bytes}`).toString();
};

const remove_cancel_button = async () => {
    const stop_generating = $('.stop_generating');

    stop_generating.addClass('stop_generating-hiding'); // Hiding 클래스 추가

    setTimeout(() => {
        stop_generating.removeClass('stop_generating-hiding'); // Hiding 클래스 제거
        stop_generating.addClass('stop_generating-hidden'); // Hidden 클래스 추가
    }, 300);
};

async function askGenAI(){
    const message_input = $('#message-input');
    message_input.css('height','80px');
    message_input.focus();
    $(window).scrollTop(0); // 페이지의 맨 위로 스크롤
    let message = message_input.val();
    console.log(message);

    if (message.length > 0) {
        message_input.value = ``;
        bw_dataset = await requestBWData(message);
        await searchResult(bw_dataset);
        arrayDataset = bwDatasetToArray(bw_dataset);
        console.log(arrayDataset);
        await requestGenAI(message, arrayDataset);
    }
}

/**
 * 브레인와이즈 데이터 검색
 * @param {*} message 
 */
async function requestBWData(message){
    $('#contentbw_QK').val(format(message));
    const formSearch = $("#resultForm");
    const formSearchArray = formSearch.serializeArray();
    console.log(formSearchArray);
    try {
        const response = await $.ajax({
            type: "POST",
            url: 'http://hub.aicasit.com/search',
            dataType: "json",
            data: formSearchArray,
        });
        console.log(response);
        if(response['status']) {
            const dataset = response['results']['document']['attachment']['document'];
            return dataset;
        } else {
        }
    } catch (error) {
        return null;
    }    
}


/**
 * 사용자 대화창 자동 스크롤 기능
 */
async function moveWindowScroll(message_box) {
    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
}

/**
 * 생성형 AI 문장생성 요청
 * @param {*} message 
 */
async function requestGenAI(message, arrayBwDataset){
    const message_box = $('#messages');
    const stop_generating = $('.stop_generating');
    const message_input = $('#message-input');

    // 입력초기화
    message_input.val('');
    message_input.html('');
    message_input.text('');

    /**대화창 스크롤바 */
    window.scrollTo(0, 0);
    window.controller = new AbortController();
    window.text = '';
    window.token = message_id();

    stop_generating.removeClass('stop_generating-hidden');

    /**사용자 아이콘 및 질문 텍스트*/
    let divMessage = $("<div></div>").addClass("message");
    let divUser = $("<div></div>").addClass("user");
    divUser.append(user_image);
    divMessage.append(divUser);
    let divContent= $("<div></div>").addClass("content")
        .attr('id','user_'+window.token);
    divContent.append(format(message));
    divMessage.append(divContent);
    message_box.append(divMessage);

    /**사용자 대화창 자동 스크롤 기능 */
    moveWindowScroll(message_box)

    /** GenAI 아이콘 및 답변창 */
    let divgMessage = $("<div></div>").addClass("message");
    let divgUser = $("<div></div>").addClass("user");
    divgUser.append(brainwise_image);
    divgMessage.append(divgUser);
    let divgContent= $("<div></div>").addClass("content")
        .attr('id','llm_'+window.token);
    let divgCursor = $("<div></div>").addClass("cursor");
    divgContent.append(divgCursor);
    divgMessage.append(divgContent);
    message_box.append(divgMessage);

    /**GenAI 대화창 자동 스크롤 기능 */
    moveWindowScroll(message_box)

    /** 라마 요청 */
    requestGenAI_LLAMA(message_box, message, arrayBwDataset)

    message_box.scrollTop = message_box.scrollHeight;
    await remove_cancel_button();

}

/**
 * 라마 LLM 요청
 * @param {*} message_box 
 * @param {*} message 
 */
async function requestGenAI_LLAMA(message_box, message, arrayBwDataset) {
    /** 질문 요청 */
    let askJson = {
        "query": message,
        "content": arrayBwDataset
    };
    const sendAksJson = JSON.stringify(askJson);
    console.log(sendAksJson);
    try {
        const response = await $.ajax({
            type: "POST",
            url: '/api/chat',
            contentType: 'application/json',
            dataType: "json",
            data: sendAksJson,
        });
        console.log(response);
        if(response['result']['status']) {
            const datatset = response['result'];
            $(`#llm_${window.token}`).append(datatset.text);
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {
            message_box.scrollTop = message_box.scrollHeight;
            await remove_cancel_button();
            $('#cursor').remove();
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {
        message_box.scrollTop = message_box.scrollHeight;
        await remove_cancel_button();
        console.log(error);
        $('#cursor').remove();

        if (error.name !== `AbortError`) {
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요.`);
        } else {
            $(`#llm_${window.token}`).append(` [중단됨]`);
        }

        window.scrollTo(0, 0);
    }    
}

/**
 * ChatGPT 요청
 * @param {*} message 
 */
async function requestGenAI_GPT(message_box, message){
    let jsonSend = {};
    jsonSend.query='추가 내용 참고해서 '+message;
    jsonSend.append=dataSum;
    const jsonTpyeData = JSON.stringify(jsonSend);
    console.log(jsonSend);
    try {
        const response = await $.ajax({
            type: "POST",
            url: 'http://hub.aicasit.com/api/chat',
            dataType: "json",
            data: jsonTpyeData,
        });
        console.log(response);
        if(response['status']) {
            const datatset = response['results'][0];
            $(`#llm_${window.token}`).append(datatset.text);
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {
            message_box.scrollTop = message_box.scrollHeight;
            await remove_cancel_button();


            $('#cursor').remove();
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {
        message_box.scrollTop = message_box.scrollHeight;
        await remove_cancel_button();


        console.log(error);

        $('#cursor').remove();

        if (error.name !== `AbortError`) {
            $(`#llm_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요.`);
        } else {
            $(`#llm_${window.token}`).append(` [중단됨]`);
        }

        window.scrollTo(0, 0);
    }    
}

async function searchResult(dataset){
    const spinner = $('.spinner');
    spinner.empty();
    dataset.forEach(function (data) {
        let titlePageNoAName = data.owner_file+' > '+data.img_file;
        let divTitle = $("<div></div>").addClass("convo");
        let spanTitle = $("<span></span>").text(titlePageNoAName);
        divTitle.append(spanTitle);
        let divContent = $("<div></div>").addClass("search-content");
        let spanContent = $("<span></span>").text(data.content);
        divContent.append(spanContent);
        spinner.append(divTitle,divContent);
    });
}

function bwDatasetToArray(dataset) {
    dataArray = []
    dataset.forEach(function (data) {
        dataArray.push(data.content)
    });  
    return dataArray;  
}