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
    defaultViewport: null
};

(async function main() {
    const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();
    // LOGIN
    await page.goto(urlLogin);
    const cpf = await page.waitForSelector('input[placeholder="CPF / CNPJ"]');
    const pass = await page.waitForSelector('input[placeholder="Senha"]');
    await cpf.type(process.env.CPF);
    await pass.type(process.env.PASS);
    await pass.press('Enter');

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
