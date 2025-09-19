  import Replicate from "replicate";
import fs from "node:fs";
import { config } from "./config.js";

// Inicializar o cliente Replicate
const replicate = new Replicate({
  auth: config.REPLICATE_API_TOKEN,
});

// Função para converter imagem para base64 (para imagens pequenas)
function imageToBase64(imageBuffer, mimeType = 'image/jpeg') {
  // Converter ArrayBuffer para Buffer se necessário
  const buffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

// Função para converter imagem para base64 (solução mais confiável)
async function uploadImageToTempService(imageBuffer, filename) {
  console.log("📤 Convertendo imagem para base64...");
  
  // Detectar tipo MIME baseado na extensão do arquivo
  const extension = filename.split('.').pop().toLowerCase();
  let mimeType = 'image/jpeg';
  
  switch (extension) {
    case 'png':
      mimeType = 'image/png';
      break;
    case 'gif':
      mimeType = 'image/gif';
      break;
    case 'webp':
      mimeType = 'image/webp';
      break;
    case 'jpg':
    case 'jpeg':
    default:
      mimeType = 'image/jpeg';
      break;
  }
  
  // Converter ArrayBuffer para Buffer
  const buffer = Buffer.from(imageBuffer);
  const sizeKB = Math.round(buffer.length / 1024);
  
  console.log(`✅ Conversão para base64 concluída (${sizeKB}KB)`);
  return imageToBase64(buffer, mimeType);
}

// Função para processar imagem com prompt
async function processImageWithPrompt(prompt, imageUrl, outputFormat = "jpg") {
  try {
    console.log("🚀 Iniciando processamento da imagem...");
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🖼️  Imagem: ${imageUrl}`);
    
    let finalImageUrl = imageUrl;
    
    // Se for uma URL local, fazer upload para um serviço temporário
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      console.log("📤 Detectada URL local, convertendo para formato público...");
      
      try {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        // Extrair extensão da URL original
        const urlParts = imageUrl.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        const extension = originalFilename.split('.').pop() || 'jpg';
        const filename = `temp-${Date.now()}.${extension}`;
        
        finalImageUrl = await uploadImageToTempService(buffer, filename);
        console.log(`✅ Conversão concluída: ${finalImageUrl.substring(0, 50)}...`);
      } catch (uploadError) {
        console.error("❌ Erro na conversão:", uploadError.message);
        return {
          success: false,
          error: "Não foi possível converter a imagem para processamento"
        };
      }
    }
    
    const input = {
      prompt: prompt,
      image_input: [finalImageUrl],
      output_format: outputFormat
    };

    console.log("⏳ Enviando requisição para o Replicate...");
    const output = await replicate.run("google/nano-banana", { input });

    console.log("✅ Processamento concluído!");
    console.log(`🔗 URL da imagem processada: ${output}`);

    // Salvar a imagem localmente
    const fileName = `processed-image-${Date.now()}.${outputFormat}`;
    console.log(`💾 Salvando imagem como: ${fileName}`);
    
    // Fazer download da imagem
    const response = await fetch(output);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(fileName, Buffer.from(buffer));
    
    console.log(`✅ Imagem salva com sucesso: ${fileName}`);
    
    return {
      success: true,
      imageUrl: output,
      localFile: fileName,
      output: output
    };

  } catch (error) {
    console.error("❌ Erro ao processar imagem:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exemplo de uso
async function main() {
  console.log("🎨 Projeto Nano Banana - Replicate API");
  console.log("=====================================");
  
  // Exemplo com a imagem fornecida
  const prompt = "troque a cor para vermelho";
  const imageUrl = "https://replicate.delivery/pbxt/NizOTNDRHvLORzA58kYA0GpaXxRdLnj3pxnHPMoZ8y5qO6i8/empty-room-with-plant.webp";
  
  const result = await processImageWithPrompt(prompt, imageUrl);
  
  if (result.success) {
    console.log("\n🎉 Processamento concluído com sucesso!");
    console.log(`📁 Arquivo salvo: ${result.localFile}`);
  } else {
    console.log("\n💥 Falha no processamento:", result.error);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Exportar função para uso em outros módulos
export { processImageWithPrompt };
    