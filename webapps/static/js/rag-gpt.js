async function requestGenAI_GPT(message){
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
            await remove_search_button();
        } else {
            message_box.scrollTop = message_box.scrollHeight;
            await remove_search_button();


            $('#cursor').remove();
            $(`#gpt_${window.token}`).append(`죄송합니다! 문제가 발생했습니다. 다시 시도해 주시거나 페이지를 새로고침 해주세요. `);

            window.scrollTo(0, 0);
        }}
    catch (error) {
        message_box.scrollTop = message_box.scrollHeight;
        await remove_search_button();


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
    await remove_search_button();

}