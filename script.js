let originalfile = null;
let compressedBlob = null;

// image load and preview 
function loadCompImage(event){
    const file = event.target.files[0];
    if(!file) return;
    originalfile = file;
    const preview = document.getElementById("comp-preview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
    document.getElementById("comp-controls").style.display = "block";
}

function compressImage(){
    if(!originalfile){
        alert("please select an image first");
        return;
    }
    const quality = document.getElementById("comp-quality").value/100;
    const img = new Image();
    img.src = URL.createObjectURL(originalfile);
    img.onload = function(){
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img,0,0);

        const progress = document.getElementById("comp-progress");
        const fill = document.getElementById("comp-fill");
        progress.style.display = "block";
        fill.style.width = "30%";

        setTimeout(() => {
            fill.style.width = "70%";
            canvas.toBlob((blob) => {
                compressedBlob = blob;
                fill.style.width = "100%";

                const resultBox = document.getElementById("comp-result");
                const compressedSize = (blob.size / 1024).toFixed(2);
                const originalSize = (originalfile.size / 1024).toFixed(2);
                document.getElementById("comp-stats").innerHTML = `
                    Original: ${originalSize} KB <br>
                    Compressed: ${compressedSize} KB <br>
                    Saved: ${(originalSize - compressedSize).toFixed(2)} KB`;
                resultBox.style.display = "block";
                document.getElementById("comp-download-row").style.display = "block";
            }, 'image/jpeg', quality);
        }, 500);
    };
}

function downloadCompressed(){
    if(!compressedBlob) return;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(compressedBlob);
    link.download = "compressed.jpg";
    link.click();
}

function resetTool(prefix){
    originalfile = null;
    compressedBlob = null;
    document.getElementById(prefix + "-input").value = "";
    document.getElementById(prefix + "-preview").style.display = "none";
    document.getElementById(prefix + "-controls").style.display = "none";
    document.getElementById(prefix + "-result").style.display = "none";
    document.getElementById(prefix + "-download-row").style.display = "none";
    document.getElementById(prefix + "-progress").style.display = "none";
}

document.getElementById("comp-dropzone").addEventListener("click", () => {
    if(e.target === document.getElementById("comp-input")) return;
    document.getElementById("comp-input").click();
});

const dropzone = document.getElementById("comp-dropzone");
dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
});
dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    document.getElementById("comp-input").files = e.dataTransfer.files;
    loadCompImage({ target: { files: [file]}});
});


const input = document.getElementById("image2pdf-input");
const container = document.getElementById("image2pdf-preview");

let imageArray = [];
input.addEventListener("change", (e) =>{
    const files = Array.from(e.target.files);
    imageArray = files;
    container.innerHTML = "";

    files.forEach((file, index) => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.dataset.index = index;
        container.appendChild(img);
    });
    document.getElementById("image2pdfbtns").style.display = "block";

    
});
new Sortable(container, {
        animation: 150
});

async function generatePDF(){
    if(imageArray.length === 0){
        alert("upload images first");
        return;
    }

    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF();
    const imgs = container.querySelectorAll("img");
    for(let i =0; i<imgs.length; i++){
        const img = imgs[i];
        const imgData = await toDataURL(img.src);
        if(i!==0) pdf.addPage();

        pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0);
    }
    pdf.save("images.pdf");
}

function toDataURL(url){
    return fetch(url)
    .then(res => res.blob()).then(blob => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    }));
}

function resetPDF(){
    imageArray = [];
    container.innerHTML = "";
    input.value = "";
}

function switchtocompressor(){
    document.getElementById("imagecompressor").style.display = "block";
    document.getElementById("image2pdf").style.display = "none";
    document.getElementById("pdfmerger").style.display = "none";
    document.getElementById("qrgenerator").style.display = "none";
}
function switchtopdf(){
    document.getElementById("imagecompressor").style.display = "none";
    document.getElementById("image2pdf").style.display = "block";
    document.getElementById("pdfmerger").style.display = "none";
    document.getElementById("qrgenerator").style.display = "none";
}

const inputs = document.getElementById("pdfmerger-input");
const preview = document.getElementById("pdfmerger-preview");
const buttons = document.getElementById("pdfmerger-btns");

let filesArray = [];

inputs.addEventListener("change", () => {
    filesArray.push(...Array.from(inputs.files));
    renderPreview();
});

function renderPreview(){
    preview.innerHTML = "";
    filesArray.forEach((file, index) => {
        const div = document.createElement("div");
        div.className = "pdf-item";
        div.dataset.index = index;
        div.innerHTML = `
        <span>${file.name}</span>
        <button class="btn btn-sm btn-danger remove-btn" onclick="removeFile(${index})">Remove</button>
        `;
        preview.appendChild(div);
    });
    buttons.style.display = filesArray.length > 0 ? "block" : "none";

}

function removeFile(index){
    filesArray.splice(index, 1);
    renderPreview();
}
new Sortable(preview, {
    animation: 150,

    onEnd: () => {

        const newOrder = [];

        preview.querySelectorAll(".pdf-item")
            .forEach(item => {
                newOrder.push(
                    filesArray[item.dataset.index]
                );
            });

        filesArray = newOrder;
        renderPreview();
    }
});
async function mergepdf() {

    if (!filesArray.length) {
        alert("Upload PDFs first");
        return;
    }

    const { PDFDocument } = PDFLib;

    const mergedPdf = await PDFDocument.create();

    for (let file of filesArray) {

        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer);

        const pages =
            await mergedPdf.copyPages(
                pdf,
                pdf.getPageIndices()
            );

        pages.forEach(p =>
            mergedPdf.addPage(p)
        );
    }

    const bytes = await mergedPdf.save();

    const blob = new Blob([bytes], {
        type: "application/pdf"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged.pdf";
    a.click();
}
function resetmerger() {
    filesArray = [];
    preview.innerHTML = "";
    input.value = "";
    buttons.style.display = "none";
}
function pdfmergershow(){
    document.getElementById("pdfmerger").style.display = "block";
    document.getElementById("imagecompressor").style.display = "none";
    document.getElementById("image2pdf").style.display = "none";
    document.getElementById("qrgenerator").style.display = "none";
}

function generateQR(){
    let text = document.getElementById("qrText").value;

    if(text.trim() === ""){
        alert("please enter the text or URL to generate QR code");
        return;
    }
    let qrContainer = document.getElementById("qrcode");

    qrContainer.innerHTML = "";
    qrContainer.style.display = "block";
    new QRCode(qrContainer, {
        text: text,
        width: 300,
        height: 300

    });
    setTimeout(() => {
        const canvas = qrContainer.querySelector("canvas");
        if(!canvas){
            alert("QR generation failed");
            return;
        }
        const pngUrl =canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "qr-code.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }, 300);
}

function qrgeneratorshow(){
    document.getElementById("pdfmerger").style.display = "none";
    document.getElementById("imagecompressor").style.display = "none";
    document.getElementById("image2pdf").style.display = "none";
    document.getElementById("qrgenerator").style.display = "block";
}