import { jest } from "@jest/globals";

export const createBotMock = () => {
  return {
    sendMessage: jest.fn().mockResolvedValue({}),
    sendPhoto: jest.fn().mockResolvedValue({}),
    deleteMessage: jest.fn().mockResolvedValue({}),
  };
};
