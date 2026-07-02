import { HfInference } from '@huggingface/inference';

/**
 * Create task-oriented HuggingFace client wrappers.
 * These methods are intentionally separate from chat-completion usage.
 */
export function createHfTaskClient(apiKey) {
  const hf = new HfInference(apiKey);

  return {
    async classify(text, labels, model = 'facebook/bart-large-mnli') {
      return hf.zeroShotClassification({
        model,
        inputs: text,
        parameters: { candidate_labels: labels },
      });
    },

    async textClassify(text, model) {
      if (!model) throw new Error('textClassify requires a model');
      return hf.textClassification({ model, inputs: text });
    },

    async summarize(text, model = 'facebook/bart-large-cnn') {
      return hf.summarization({
        model,
        inputs: text,
        parameters: { max_length: 300 },
      });
    },

    async embed(text, model = 'sentence-transformers/all-MiniLM-L6-v2') {
      return hf.featureExtraction({ model, inputs: text });
    },
  };
}
