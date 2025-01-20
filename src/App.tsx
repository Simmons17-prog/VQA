import React, { useState } from 'react';
import { Upload, Send, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract only the base64 data, removing the data URL prefix
        const base64Data = result.split(',')[1];
        setImage(base64Data);
        setError(null);
      };
      reader.onerror = (e) => {
        const errorMessage = e?.target?.error?.message || 'Failed to read the image file';
        setError(errorMessage);
        console.error('File reading error:', errorMessage);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !question) {
      setError('Please upload an image and enter a question');
      return;
    }

    if (!apiKey) {
      setError('Please enter your Hugging Face API token');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/dandelin/vilt-b32-finetuned-vqa',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: {
              image: image,
              question: question,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed (${response.status}): ${errorText || response.statusText}`
        );
      }
      
      const result = await response.json();
      if (!result?.[0]?.answer) {
        throw new Error('Invalid response format from API');
      }
      
      setAnswer(result[0].answer);
      setError(null);
      setIsConfigured(true);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred while processing your request';
      console.error('API Error:', errorMessage);
      setError(errorMessage);
      setAnswer('');
      if (errorMessage.includes('token seems invalid')) {
        setIsConfigured(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setAnswer('');
    setError(null);
    setQuestion('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2 text-indigo-900">
            Visual Question Answering
          </h1>
          <p className="text-center mb-8 text-gray-600">
            Upload an image and ask questions about it
          </p>

          <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
            {!isConfigured && (
              <div className="mb-6">
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Hugging Face API Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your Hugging Face API token"
                  />
                  <a
                    href="https://huggingface.co/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Get Token
                  </a>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  You need a Hugging Face API token to use this demo. Get one for free at huggingface.co
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-center w-full">
                {image ? (
                  <div className="relative w-full aspect-video">
                    <img
                      src={`data:image/jpeg;base64,${image}`}
                      alt="Uploaded"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <button
                      onClick={resetForm}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or GIF (max 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      aria-label="Upload image"
                    />
                  </label>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                  Ask a question about the image
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., What color is the car?"
                    disabled={!image || loading}
                    aria-label="Question input"
                  />
                  <button
                    type="submit"
                    disabled={!image || !question || loading || !apiKey}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={loading ? "Loading..." : "Send question"}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {answer && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">Answer:</h3>
                <p className="text-gray-700">{answer}</p>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Powered by Hugging Face Inference API</p>
            <p className="mt-1">Upload an image and ask questions about its contents</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;