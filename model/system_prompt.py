"""
module.name : system_prompt.py
module.purpose: prompt 생성
module.create.date: 2024. 02. 21
module.writer: Haengun Oh
module.writer.email: jamesohe@gmail.com
"""

# LLM에 대한 사용자 질문과 과거 질문을 결합하는 함수
def composit_question(preprompt, past_dialog, question, reference):         
    message = f'{preprompt}\n\n'    
    if past_dialog:
        for conversation in past_dialog:
            message += f'### 질문 {conversation["question"]}\n'
            message += f'### 답변: {conversation["answer"]}\n\n'
    
    for idx, item in enumerate(reference, start=1):
        message += f'### 참고 자료 {idx}]\n'
        message += f'{item}\n\n'
                    
    message += f'### 질문\n'
    message += f'{question}\n\n'
      
    return (message + "\n\n### 답변:").strip()
    