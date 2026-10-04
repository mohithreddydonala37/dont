export const maxVoiceTextLength = 1_200;

export type VoiceRequest = {
  text: string;
};

export type VoiceAudio = {
  audio: Buffer;
  contentType: "audio/mpeg";
};
