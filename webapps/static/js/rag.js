let dataSum = ''
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

async function askGpt(){
    dataSum = ""
    const message_input = $('#message-input');
    message_input.css('height','80px');
    message_input.focus();
    $(window).scrollTop(0); // 페이지의 맨 위로 스크롤
    let message = message_input.val();
    console.log(message);

    if (message.length > 0) {
        message_input.value = ``;
        await ask_gpt(message);
    }
}

async function ask_gpt(message){
    const message_box = $('#messages');
    const stop_generating = $('.stop_generating');
    const message_input = $('#message-input');

    // 입력초기화
    message_input.val('');
    message_input.html('');
    message_input.text('');

    $('#contentbw_QK').val(format(message));
    const formSearch = $("#resultForm");
    const formSearchArray = formSearch.serializeArray();

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
            await searchResult(dataset)
        } else {
        }
    } catch (error) {
    }

    window.scrollTo(0, 0);
    window.controller = new AbortController();



    window.text = '';
    window.token = message_id();

    stop_generating.removeClass('stop_generating-hidden');

    let divMessage = $("<div></div>").addClass("message");
    let divUser = $("<div></div>").addClass("user");
    divUser.append(user_image);
    divMessage.append(divUser);
    let divContent= $("<div></div>").addClass("content")
        .attr('id','user_'+window.token);
    divContent.append(format(message));
    divMessage.append(divContent);
    message_box.append(divMessage);



    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);



    let divgMessage = $("<div></div>").addClass("message");
    let divgUser = $("<div></div>").addClass("user");
    divgUser.append(gpt_image);
    divgMessage.append(divgUser);
    let divgContent= $("<div></div>").addClass("content")
        .attr('id','gpt_'+window.token);
    let divgCursor = $("<div></div>").addClass("cursor");
    divgContent.append(divgCursor);
    divgMessage.append(divgContent);
    message_box.append(divgMessage);

    message_box.scrollTop = message_box.scrollHeight;
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1000));
    window.scrollTo(0, 0);

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
            $(`#gpt_${window.token}`).append(datatset.text);
            window.scrollTo(0, 0);
            await remove_cancel_button();
        } else {
            message_box.scrollTop = message_box.scrollHeight;
            await remove_cancel_button();


            $('#cursor').remove();
            $(`#gpt_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {
        message_box.scrollTop = message_box.scrollHeight;
        await remove_cancel_button();


        console.log(error);

        $('#cursor').remove();

        if (error.name !== `AbortError`) {
            $(`#gpt_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요.`);
        } else {
            $(`#gpt_${window.token}`).append(` [중단됨]`);
        }

        window.scrollTo(0, 0);
    }

    message_box.scrollTop = message_box.scrollHeight;
    await remove_cancel_button();

}


async function searchResult(dataset){
    const spinner = $('.spinner');
    spinner.empty();
    dataset.forEach(function (data) {
        let titlePageNoAName = data.owner_file+' > '+data.img_file;
        console.log(data.title);
        let divTitle = $("<div></div>").addClass("convo");
        let spanTitle = $("<span></span>").text(titlePageNoAName);
        divTitle.append(spanTitle);
        let divContent = $("<div></div>").addClass("search-content");
        let spanContent = $("<span></span>").text(data.content);
        divContent.append(spanContent);
        spinner.append(divTitle,divContent);
        dataSum += data.content;
    });
    console.log(dataSum);
    const maxLength = 2000;
    if (dataSum.length > maxLength) {
        dataSum = dataSum.substring(0, maxLength);
    }
    console.log(dataSum.length);
}