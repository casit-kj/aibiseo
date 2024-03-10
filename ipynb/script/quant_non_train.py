import torch
from argparse import ArgumentParser
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig
from transformers import AutoTokenizer

def main():
    parser = ArgumentParser()
    parser.add_argument("--pretrained_model_dir", type=str, required=True, help="Path to the pretrained model directory")
    parser.add_argument("--quantized_model_dir", type=str, required=True, help="Path to save the quantized model")
    parser.add_argument("--bits", type=int, default=4, choices=[2, 3, 4, 8], help="Bit precision for quantization")
    parser.add_argument("--group_size", type=int, default=128, help="Group size for quantization")
    parser.add_argument("--fast_tokenizer", action="store_true", help="Whether to use fast tokenizer")
    args = parser.parse_args()

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        args.pretrained_model_dir,
        use_fast=args.fast_tokenizer,
        trust_remote_code=True
    )

    # Load model
    model = AutoGPTQForCausalLM.from_pretrained(
        args.pretrained_model_dir,
        quantize_config=BaseQuantizeConfig(bits=args.bits, group_size=args.group_size)
    )

    # Perform quantization without training or examples
    model.quantize_directly()

    # Save the quantized model
    model.save_quantized(args.quantized_model_dir)

    print(f"Quantized model saved to {args.quantized_model_dir}")

if __name__ == "__main__":
    import logging
    logging.basicConfig(format="%(asctime)s %(levelname)s [%(name)s] %(message)s", level=logging.INFO, datefmt="%Y-%m-%d %H:%M:%S")
    main()
