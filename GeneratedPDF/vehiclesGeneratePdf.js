const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

function convertTo12HourFormat(dateTime) {
  // Split the dateTime string into date and time parts
  const [datePart, timePart] = dateTime.split(' ');
  // Split the time part into hours, minutes, and seconds
  let [hours, minutes, seconds] = timePart.split(':');
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  seconds = parseInt(seconds);
  // Determine AM or PM suffix
  const ampm = hours >= 12 ? 'PM' : 'AM';
  // Convert hours from 24-hour format to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  // Format the time string in 12-hour format
  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')} ${ampm}`;
  // Return the date part with the formatted time
  return `${datePart} ${formattedTime}`;
}
const generatePDF = async (data, username) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const html = fs.readFileSync(path.resolve(__dirname, '../template/GeneratePdf.html'), 'utf8');

  const tableRows = data.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.Vehicle_Label}</td>
      <td>${item.Client}</td>
      <td>${item.Installation_Date}</td>
      <td>${item.paid_until}</td>
      <td>${item.Expiry_Datee}</td>
      <td>${item.device_type}</td>
      <td>${item.pend_date}</td>
      <td>${item.periods}</td>
      <td>${item.mon_charges}</td>
      <td>${item.amount}</td>
      <td>${item.vat}</td>
      <td>${item.tamount}</td>
      <td>${item.Vehicle_Status}</td>
    </tr>`).join('');

    const date = new Date();
    const datePart = date.toISOString().split('T')[0];
    const timePart = date.toLocaleTimeString('en-US', {
      hour12: false,
    });
    const messageTime = `${datePart} ${timePart}`;

    const imageBuffer = fs.readFileSync(path.resolve(__dirname, '../images/companylogo.png'));
    const imageBase64 = imageBuffer.toString('base64');
  const content = html
    .replace('{{imageBase64}}', imageBase64)
    .replace('{{companyname}}', 'Click Life Information Technology W.L.L')
    .replace('{{companyarabicname}}', '(كليك لايف لتكنولوجيا المعلومات ذ م م)')
    .replace('{{username}}', `User Name: ${username}`)
    .replace('{{currentDate}}', `Report Date: ${convertTo12HourFormat(messageTime)}`)
    .replace('{{data}}', `<table>
      <tr>
        <th>Serial</th>
        <th>Vehicle</th>
        <th>Client</th>
        <th>Installation Date</th>
        <th>Start Date</th>
        <th>Expiry Date</th>
        <th>Device Type</th>
        <th>Pending Period</th>
        <th>Period</th>
        <th>Charges</th>
        <th>Amount</th>
        <th>VAT</th>
        <th>Total Amount</th>
        <th>Status</th>
      </tr>
      ${tableRows}
    </table>`);

  await page.setContent(content, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.emulateMediaType('screen');

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    timeout: 60000,
  });

  await browser.close();
  return pdfBuffer;
};

module.exports = generatePDF;