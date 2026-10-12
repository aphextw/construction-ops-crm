const getSharingModule = () => {
  try {
    return require("expo-sharing");
  } catch (error) {
    console.log("Sharing module unavailable:", error);
    return null;
  }
};

const openWithSystemShare = async (
  uri: string,
  options?: {
    mimeType?: string;
    UTI?: string;
    dialogTitle?: string;
  },
) => {
  const Sharing = getSharingModule();

  if (Sharing && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(uri, {
      mimeType: options?.mimeType,
      UTI: options?.UTI,
      dialogTitle: options?.dialogTitle,
    });

    return true;
  }

  return false;
};
