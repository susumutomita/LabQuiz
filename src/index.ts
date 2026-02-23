import { apiCall } from './router';

function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('LAB QUIZ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Expose global functions for GAS runtime
(globalThis as any).doGet = doGet;
(globalThis as any).apiCall = apiCall;
