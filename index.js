import fs from 'fs';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

let data;
try {
    const input = fs.readFileSync('./process/processos', 'utf-8');
    data = input.split('\n');
} catch (err) {
    throw err;
}

let processos = [];
data.forEach(number => processos.push(number));

let processWithValues = [];
const urlLogin = 'https://pje.tjmg.jus.br/pje/login.seam';

const chromeOptions = {
    headless: true,
    defaultViewport: null,
    args: [
        '--no-first-run', //  Impede que o navegador exiba a página de boas-vindas na primeira execução.
        '--no-sandbox', // "Disables the sandbox for all process types that are normally sandboxed.
        '--disable-setuid-sandbox', // "Disables the sandbox for all process types that are normally sandboxed.
        '--disable-sync', // "Disables syncing browser data to a Google Account"
        '--disable-dev-shm-usage', // The /dev/shm partition is too small in certain VM environments, causing Chrome to fail or crash (see http://crbug.com/715363). 
        '--disable-gpu',
        "--disable-accelerated-2d-canvas",
        '--ignore-certificate-errors',
        '--enable-logging,', 
        '--v=1'
    ],
};

(async function main() {
    const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0');
    await page.setRequestInterception(true);

    // Para não fazer requisições de imagens e fonts. 
    // Assim, o carregamento da página fica mais rápido
    page.on('request', (request) => {
        if (['image', 'font'].indexOf(request.resourceType()) !== -1) {
            request.respond({status: 200, body: 'aborted'})
        } else {
            request.continue();
        }
    });
    
    page.on('requestfailed', request => {
        console.log(request.url() + ' ' + request.failure().errorText);
    });

    // LOGIN
    await page.goto(urlLogin);
    // const cpf = await page.waitForSelector('input[placeholder="CPF / CNPJ"]');
    // const pass = await page.waitForSelector('input[placeholder="Senha"]');
    // Houve versão do PJE em que o login estava contido em um <iframe>
    const elementHandle = await page.$('iframe[id="ssoFrame"]');
    const frameLogin =  await elementHandle.contentFrame();
    const cpf = await frameLogin.waitForSelector('input[id="username"]', {visible: true});
    const pass = await frameLogin.waitForSelector('input[id="password"]', {visible: true});
    await cpf.type(process.env.CPF);
    await pass.type(process.env.PASS);
    await pass.press('Enter');
    // await page.click('#btnEntrar');

    // ABRINDO PÁGINA DE PESQUISAR PROCESSO
    // await new Promise(r => setTimeout(r, 2000));
    try {
        await page.waitForSelector('a[title="Abrir menu"]',  { timeout: 1000 });
    } 
    catch (error) {
        await page.reload();
    }
    await new Promise(r => setTimeout(r, 1000));
    await page.click('span.avatar.tip-bottom');
    await new Promise(r => setTimeout(r, 1000));
    // const perfil = page.waitForSelector('select[id="papeisUsuarioForm:usuarioLocalizacaoDecoration:usuarioLocalizacao"]', { timeout: 1000 });
    // console.log(perfil);
    // await perfil.select("1");
    const perfil = 'select#papeisUsuarioForm\\:usuarioLocalizacaoDecoration\\:usuarioLocalizacao';
    const optionValue = '1';
    await page.select(perfil, optionValue);
    await new Promise(r => setTimeout(r, 2000));

    // OPEN PAGE SEARCH PROCESS
    const openMenu = await page.waitForSelector('a[title="Abrir menu"]');
    await openMenu.click();
    const fastAcess = await page.waitForSelector('input[placeholder="Acesso rápido"]');
    await fastAcess.type('Pesquisar');
    const result = await page.waitForSelector('div.resultado-busca');
    await result.click();

    const inputNumberSequential= await page.waitForSelector('input[id="fPP:numeroProcesso:numeroSequencial"]');
    const inputNumberDigitChecer = await page.waitForSelector('input[id="fPP:numeroProcesso:numeroDigitoVerificador"]');
    const inputNumberYear = await page.waitForSelector('input[id="fPP:numeroProcesso:Ano"]');
    const inputNumberJustice = await page.waitForSelector('input[id="fPP:numeroProcesso:NumeroOrgaoJustica"]');
    
    // START LOOP 
    const processLength = processos.length;
    for ( let i = 0; i < processLength; i++) {
        const numberProcess = processos[i];
        
        await inputNumberSequential.type(numberProcess.slice(0, 7));
        await inputNumberDigitChecer.type(numberProcess.slice(8, 10));
        await inputNumberYear.type(numberProcess.slice(11, 15));
        await inputNumberJustice.type(numberProcess.slice(21, 25));
        
        const buttonSearch = await page.waitForSelector('input[value="Pesquisar"]');
        await buttonSearch.click();
        await new Promise(r => setTimeout(r, 2000));

        // const linkProcess = await page.waitForSelector(`a[title="${numberProcess}"]`);
        const linkProcess = await page.waitForSelector(`a.btn-link.btn-condensed`);
        await linkProcess.click();

        // switching to a new tab
        await new Promise(r => setTimeout(r, 2000));
        const pages = await browser.pages();
        const pageTwo = pages[2];
        pageTwo.bringToFront().then(async () => {
            const values = await pageTwo.$$eval('dd', (values) => {
                return values.map((value => value.textContent))
            });
            let value = '';
            values.forEach((v) => {
                if (v.includes('R$')) value = v;
            });
            console.log(`${numberProcess.slice(0, -1)}:${value}`);
            processWithValues.push(`${numberProcess.slice(0, -1)}:${value}`);
            await pageTwo.close();
        })

        await inputNumberSequential.click({clickCount: 3});
        await inputNumberSequential.press('Backspace'); 
        await inputNumberDigitChecer.click({clickCount: 3});
        await inputNumberDigitChecer.press('Backspace');
        await inputNumberYear.click({clickCount: 3});
        await inputNumberYear.press('Backspace');
        await inputNumberJustice.click({clickCount: 3});
        await inputNumberJustice.press('Backspace');
    };
        
    await browser.close();         

    const fd = fs.openSync('resultados-09.txt', 'w');
    processWithValues.forEach((item) => {
        fs.writeFileSync('resultados.txt', item + '\n', { flag: 'a' });
    });
    fs.closeSync(fd);
})()
