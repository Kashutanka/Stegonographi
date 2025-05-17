window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('embedBtn').addEventListener('click', embedText);
  document.getElementById('extractBtn').addEventListener('click', extractText);
  document.getElementById('encodeBtn').addEventListener('click', encodeInvisible);
  document.getElementById('decodeBtn').addEventListener('click', decodeInvisible);
});

function showMessage(text) {
  const messageBox = document.getElementById('message');

  // Сначала скрываем сообщение (на случай, если оно уже отображается)
  messageBox.classList.remove('show');

  // Обновляем текст
  messageBox.textContent = text;

  // Показываем сообщение
  setTimeout(() => {
    messageBox.classList.add('show');
  }, 50); // Небольшая задержка для правильной работы анимации

  // Скрываем сообщение через 5 секунд
  setTimeout(() => {
    messageBox.classList.remove('show');
  }, 3000);
}

// Функция для скрытия текста в изображении (LSB)
function embedText() {
  const fileInput = document.getElementById('imageInput');
  const text = document.getElementById('secretText').value;
  const downloadLink = document.getElementById('downloadLink');

  if (!fileInput.files[0]) {
    alert('Пожалуйста, выберите изображение.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const binaryText = text
        .split('')
        .map(c => c.charCodeAt(0).toString(2).padStart(8, '0'))
        .join('') + '00000000';

      let bitIndex = 0;

      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          if (bitIndex < binaryText.length) {
            data[i + j] = (data[i + j] & 0xFE) | parseInt(binaryText[bitIndex]);
            bitIndex++;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = 'stego.png';
        downloadLink.classList.remove('hidden');
        showMessage('Текст успешно встроен!');
      }, 'image/png');
    };
  };

  reader.readAsDataURL(fileInput.files[0]);
}


function extractText() {
  const input = document.getElementById('decodeInput');
  const output = document.getElementById('extractedText');

  if (!input.files[0]) {
    alert('Пожалуйста, выберите изображение.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;

    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let binary = '';

      // Извлекаем последние биты каждого канала пикселя (красный, зеленый, синий)
      for (let i = 0; i < imageData.data.length; i += 4) {
        let r = imageData.data[i];     // Красный канал
        let g = imageData.data[i + 1]; // Зеленый канал
        let b = imageData.data[i + 2]; // Синий канал

        // Добавляем последние биты каждого канала
        binary += (r & 1).toString();
        binary += (g & 1).toString();
        binary += (b & 1).toString();
      }

      // Преобразуем бинарную строку в текст
      let decodedText = '';
      for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.slice(i, i + 8);
        if (byte === '00000000') break; // Завершающий маркер
        decodedText += String.fromCharCode(parseInt(byte, 2)); // Преобразуем бинарный код в символ
      }

      // Выводим результат
      if (decodedText) {
        output.textContent = decodedText;
        showMessage('Текст успешно извлечён из изображения!');
      } else {
        output.textContent = 'Не удалось извлечь текст из изображения.';
        showMessage('Не удалось извлечь текст.');
      }
    };

    img.onerror = function () {
      output.textContent = 'Ошибка при загрузке изображения.';
      showMessage('Ошибка при загрузке изображения.');
    };
  };

  reader.onerror = function () {
    output.textContent = 'Ошибка при чтении файла.';
    showMessage('Ошибка при чтении файла.');
  };

  reader.readAsDataURL(input.files[0]);
}


// Функция для кодирования текста с невидимыми символами
function encodeInvisible() {
  const input = document.getElementById('visibleText').value;
  const output = document.getElementById('invisibleOutput');

  const binary = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  const encoded = binary.replace(/0/g, '\u200b').replace(/1/g, '\u200c');

  output.value = encoded;
  showMessage('Текст успешно закодирован!');
}

// Функция для декодирования текста с невидимыми символами
function decodeInvisible() {
  const encoded = document.getElementById('invisibleOutput').value;
  const decodedOutput = document.getElementById('decodedOutput');

  const binary = encoded.split('').map(c => {
    if (c === '\u200b') return '0';
    if (c === '\u200c') return '1';
    return '';
  }).join('');

  let result = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    if (byte.length === 8) result += String.fromCharCode(parseInt(byte, 2));
  }

  decodedOutput.textContent = result;
  showMessage('Текст успешно декодирован!');
}