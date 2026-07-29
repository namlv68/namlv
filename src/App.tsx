import React, { useState, useEffect } from 'react';
import { Camera, Users, Utensils, Zap, Copy, Check, Globe, Clock, Flame, ChevronUp, ChevronDown, MonitorPlay, Droplets, Wind, Star, Search, PlusCircle, Coffee, EyeOff, Shirt, Sparkles, Link, ShoppingBag, Key, Download, RefreshCw, X, Gift, Ruler, History, Trash2, RotateCcw, FileText, ChevronRight, Play } from 'lucide-react';
import { executeAiWithFallback } from './aiService';

export interface HistoryItem {
  id: string;
  timestamp: string;
  foodName: string;
  foodSizeLevel: string;
  numCharacters: number;
  duration: number;
  isCommerceMode: boolean;
  productName?: string;
  productActionDescription?: string;
  generatedPrompts: { id: number; index: number; vi: string; en: string; zh: string }[];
  params: any;
}

const cleanUnwantedPrefixes = (text: string): string => {
  if (!text) return text;
  let res = text;

  // Pattern 1: Detailed Timeline (note: characters eat together... dipping sauce...)
  const englishRegex = /Detailed Timeline\s*\(\s*note:\s*characters eat together[\s\S]*?before chewing\s*\):?/gi;
  res = res.replace(englishRegex, '');

  // Pattern 2: 详细时间轴 (注意：角色们一起吃... 再咀嚼...)
  const chineseRegex = /详细时间轴\s*\(\s*注意：角色们一起吃[\s\S]*?再咀嚼\s*\):?/gi;
  res = res.replace(chineseRegex, '');

  // Cleanup potential leftover standalone "Detailed Timeline:" or "详细时间轴:" headers
  res = res.replace(/Detailed Timeline\s*:?\s*/gi, '');
  res = res.replace(/详细时间轴\s*:?\s*/gi, '');

  // Also remove potential leading colons or empty lines
  res = res.trim();
  if (res.startsWith(':')) {
    res = res.substring(1).trim();
  }
  return res;
};

const loadSavedState = () => {
  try {
    const saved = localStorage.getItem('mukbangAppState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.generatedPrompts && Array.isArray(parsed.generatedPrompts)) {
        parsed.generatedPrompts = parsed.generatedPrompts.map((p: any) => ({
          ...p,
          vi: cleanUnwantedPrefixes(p.vi),
          en: cleanUnwantedPrefixes(p.en),
          zh: cleanUnwantedPrefixes(p.zh)
        }));
      }
      return parsed;
    }
  } catch (e) {
    console.error("Lỗi parse saved state:", e);
  }
  return {};
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mukbangAppAuth') === 'true';
  });
  const [loginTime, setLoginTime] = useState<number | null>(() => {
    const time = localStorage.getItem('mukbangAppAuthTime');
    return time ? parseInt(time, 10) : null;
  });
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Keep session alive indefinitely; no auto-logout.
  }, [isAuthenticated]);

  const savedState = loadSavedState();
  const [numCharacters, setNumCharacters] = useState<number>(savedState.numCharacters ?? 1);
  const [outfitMode, setOutfitMode] = useState<string>(savedState.outfitMode ?? 'Cameo'); // 'Cameo' or 'Random'
  const [customOutfit, setCustomOutfit] = useState<string>(savedState.customOutfit ?? '');
  const [outfitNam, setOutfitNam] = useState<string>(savedState.outfitNam ?? '');
  const [outfitNgoc, setOutfitNgoc] = useState<string>(savedState.outfitNgoc ?? '');
  const [outfitThu, setOutfitThu] = useState<string>(savedState.outfitThu ?? '');
  const [cameraStyle, setCameraStyle] = useState<string>(savedState.cameraStyle ?? 'Macro');
  const [eatingStyle, setEatingStyle] = useState<string>(savedState.eatingStyle ?? 'PeelingShrimp');
  const [characterActionStyle, setCharacterActionStyle] = useState<string>(savedState.characterActionStyle ?? 'PlateDipping');
  const [generationMode, setGenerationMode] = useState<string>(savedState.generationMode ?? 'Detailed'); // 'Detailed' or 'Fixed'
  const [syncingPromptId, setSyncingPromptId] = useState<string | null>(null);
  const [dialogueInput, setDialogueInput] = useState<string>(savedState.dialogueInput ?? '');
  const [isDialogueEnabled, setIsDialogueEnabled] = useState<boolean>(savedState.isDialogueEnabled ?? true);

  const [settingMode, setSettingMode] = useState<string>(savedState.settingMode ?? 'Cameo'); // 'Cameo' or 'Theme'
  const [customSetting, setCustomSetting] = useState<string>(savedState.customSetting ?? '');
  const charNamesList = ["NAM", "NGỌC", "THƯ"];
  const [theme, setTheme] = useState<string>('Custom');
  const [customFood, setCustomFood] = useState<string>(savedState.customFood ?? '');
  const [foodSizeLevel, setFoodSizeLevel] = useState<string>(savedState.foodSizeLevel ?? 'Khổng lồ');
  const [foodSizeDetails, setFoodSizeDetails] = useState<string>(savedState.foodSizeDetails ?? '');
  const [isSuggestingSize, setIsSuggestingSize] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(savedState.duration ?? 12);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<{ vi: string, en: string, zh: string }[] | null>(savedState.generatedPrompts ?? null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCommerceMode, setIsCommerceMode] = useState<boolean>(savedState.isCommerceMode ?? false);
  const [productName, setProductName] = useState<string>(savedState.productName ?? '');
  const [productCategory, setProductCategory] = useState<string>(savedState.productCategory ?? 'Grocery');
  const [productActionDescription, setProductActionDescription] = useState<string>(savedState.productActionDescription ?? '');
  const [productImage, setProductImage] = useState<string | null>(savedState.productImage ?? null);
  const [isSuggestingProductAction, setIsSuggestingProductAction] = useState<boolean>(false);

  const [historyList, setHistoryList] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mukbangAppHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  useEffect(() => {
    const stateObj = {
      numCharacters, outfitMode, customOutfit, outfitNam, outfitNgoc, outfitThu, settingMode, customSetting, theme, customFood, foodSizeLevel, foodSizeDetails, duration, isCommerceMode, productName, productCategory, productActionDescription, productImage, cameraStyle, eatingStyle, characterActionStyle, generationMode, generatedPrompts, dialogueInput, isDialogueEnabled
    };
    localStorage.setItem('mukbangAppState', JSON.stringify(stateObj));
  }, [numCharacters, outfitMode, customOutfit, outfitNam, outfitNgoc, outfitThu, settingMode, customSetting, theme, customFood, foodSizeLevel, foodSizeDetails, duration, isCommerceMode, productName, productCategory, productActionDescription, productImage, cameraStyle, eatingStyle, characterActionStyle, generationMode, generatedPrompts, dialogueInput, isDialogueEnabled]);

  useEffect(() => {
    localStorage.setItem('mukbangAppHistory', JSON.stringify(historyList));
  }, [historyList]);

  const cleanJson = (str: string) => {
    // Remove markdown code blocks if present
    let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn("Initial JSON parse failed, attempting to fix control characters...", e);
      // Fix: Replace literal control characters (like raw newlines, tabs) inside string values
      // This regex matches control characters (range 0-31) and escapes them
      const fixed = cleaned.replace(/[\x00-\x1f\x7f-\x9f]/g, (c) => {
        switch (c) {
          case '\n': return '\\n';
          case '\r': return '\\r';
          case '\t': return '\\t';
          default: return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
        }
      });
      
      try {
        parsed = JSON.parse(fixed);
      } catch (e2) {
        console.error("Fixed JSON parse failed as well:", e2);
        throw e2;
      }
    }

    const sanitizeItem = (item: any) => {
      if (!item) return item;
      if (item.timeline) {
        if (typeof item.timeline === 'string') {
          item.timeline = cleanUnwantedPrefixes(item.timeline);
        } else if (typeof item.timeline === 'object') {
          for (const key in item.timeline) {
            if (typeof item.timeline[key] === 'string') {
              item.timeline[key] = cleanUnwantedPrefixes(item.timeline[key]);
            }
          }
        }
      }
      return item;
    };

    if (Array.isArray(parsed)) {
      return parsed.map(sanitizeItem);
    } else if (typeof parsed === 'object') {
      return sanitizeItem(parsed);
    }

    return parsed;
  };

  const handleSyncPrompt = async (promptId: string) => {
    const prompt = generatedPrompts?.find(p => p.id === promptId);
    if (!prompt) return;

    setSyncingPromptId(promptId);
    try {
      const responseStr = await executeAiWithFallback(apiKeys, activeApiKeyIndex, setActiveApiKeyIndex, async (genAI) => {
        const response = await genAI.models.generateContent({
          model: "gemini-3.5-flash",
          contents: "You are a professional translator. Translate the text directly and return a valid JSON object matching this schema: {\"en\": \"English translation\", \"zh\": \"Chinese translation\"}. IMPORTANT: Output MUST be a valid JSON string. Escape all newlines as \\n. DO NOT translate or change character names: NAM, NGỌC, THƯ. Keep them exactly as they are in all languages.\n\nVietnamese text:\n" + prompt.vi
        });
        return response.text;
      });

      const parsed = cleanJson(responseStr);

      if (parsed.en && parsed.zh) {
        setGeneratedPrompts(prev => prev?.map(p => 
          p.id === promptId ? { ...p, en: cleanUnwantedPrefixes(parsed.en), zh: cleanUnwantedPrefixes(parsed.zh) } : p
        ) || null);
      }
    } catch (e) {
      console.error("Lỗi đồng bộ:", e);
      alert("Đồng bộ thất bại, vui lòng kiểm tra API key v\u00e0 thử lại.");
    } finally {
      setSyncingPromptId(null);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setGeneratedPrompts(null);
    setNumCharacters(1);
    setOutfitMode('Cameo');
    setCustomOutfit('');
    setSettingMode('Cameo');
    setCustomSetting('');
    setCustomFood('');
    setDuration(12);
    setIsCommerceMode(false);
    setProductName('');
    setProductCategory('Grocery');
    setProductActionDescription('');
    setCameraStyle('Macro');
    setEatingStyle('Steady');
  };

  // API Key State
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(true);
  const [showPromoPopup, setShowPromoPopup] = useState<boolean>(false);
  const [tempApiKeysInput, setTempApiKeysInput] = useState<string>('');
  const [activeApiKeyIndex, setActiveApiKeyIndex] = useState<number>(0);

  useEffect(() => {
    const storedKeys = localStorage.getItem('geminiApiKeys');
    if (storedKeys) {
      try {
        const parsed = JSON.parse(storedKeys);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApiKeys(parsed);
          setTempApiKeysInput(parsed.join('\n'));
          setShowApiKeyModal(false);
        }
      } catch (e) {
        console.error("Lỗi parse API Keys:", e);
      }
    }
  }, []);

  const handleSaveApiKeys = () => {
    const keys = tempApiKeysInput.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length > 0) {
      setApiKeys(keys);
      localStorage.setItem('geminiApiKeys', JSON.stringify(keys));
      setShowApiKeyModal(false);
      setActiveApiKeyIndex(0);
    } else {
      alert("Vui lòng nhập ít nhất 1 API key.");
    }
  };

  const cameraStyles = [
    { id: 'Macro', name: 'Cận cảnh (Macro)', icon: '🔍', descriptions: { vi: 'Macro/Close-up, tập trung vào chi tiết và bề mặt đồ ăn.', en: 'Macro/Close-up, focusing on food details and textures.', zh: '微距/特写，聚焦食物细节和纹理。' } },
    { id: 'Fixed', name: 'Góc máy cố định', icon: '🎥', descriptions: { vi: 'Góc máy cố định (Fixed), khung hình trung bình, ổn định.', en: 'Fixed camera angle, medium shot, stable and consistent.', zh: '固定摄影机角度，中景，稳定且一致。' } },
    { id: 'ZoomIn', name: 'Zoom gần đồ ăn', icon: '🔎', descriptions: { vi: 'Slow Zoom mượt mà vào món ăn đang được nhân vật ăn.', en: 'Smooth slow zoom into the food being eaten by the characters.', zh: '平滑地慢速放大角色正在吃的食物。' } },
    { id: 'TopDown', name: 'Góc quay từ trên xuống', icon: '📐', descriptions: { vi: 'Top-down shot, bao quát toàn bộ mâm thức ăn từ trên cao.', en: 'Top-down shot, overlooking the entire food tray from above.', zh: '俯拍镜头，从上方俯瞰整个食物托盘。' } },
    { id: 'Dynamic', name: 'Linh hoạt (Pan/Tilt)', icon: '🔄', descriptions: { vi: 'Chuyển động linh hoạt (Dynamic), lia máy mượt mà xung quanh đồ ăn.', en: 'Dynamic movement, smooth pan/tilt around the food.', zh: '动态运动，在食物周围平稳平移/倾斜。' } },
    { id: 'Handheld', name: 'Cầm tay (Handheld)', icon: '🤳', descriptions: { vi: 'Góc quay cầm tay hơi rung lắc nhẹ, tạo cảm giác chân thực, đời thường.', en: 'Handheld shot with slight tremors, creating a realistic, everyday feel.', zh: '手持镜头，轻微颤抖，营造出生动感。' } },
    { id: 'Rotate', name: 'Xoay tròn (Orbit)', icon: '🎡', descriptions: { vi: 'Máy quay xoay tròn quanh mâm đồ ăn để thấy mọi góc độ.', en: 'The camera orbits around the food tray to show all angles.', zh: '摄影机绕着食物盘旋转，展示所有角度。' } },
    { id: 'POV', name: 'Góc nhìn thứ nhất (POV)', icon: '👤', descriptions: { vi: 'Góc nhìn POV từ mắt nhân vật đang chuẩn bị ăn.', en: 'POV shot from the eyes of the character about to eat.', zh: '从准备进食的角色眼中看到的 POV 镜头。' } },
  ];

  const eatingStyles = [
    { id: 'PeelingShrimp', name: 'Bóc vỏ chỉ ăn thịt tôm', icon: '🦐', descriptions: { vi: 'Thao tác bóc sạch vỏ tôm khéo léo, bỏ lớp vỏ ngoài ra đĩa riêng, chấm đẫm nước sốt và chỉ thưởng thức phần thịt tôm tươi ngon mềm mọng.', en: 'Skillfully peeling off shrimp shells completely, placing shells aside on a plate, dipping in sauce and savoring only the tender fresh shrimp meat.', zh: '熟练地完全剥去虾壳，将外壳放在一旁盘子里，深蘸酱汁，只品尝鲜嫩多汁的虾肉。' } },
    { id: 'Steady', name: 'Bình tĩnh', icon: '🧘', descriptions: { vi: 'Ăn từ tốn, bình tĩnh, thưởng thức kỹ từng miếng.', en: 'Eating calmly, steady, enjoying every bite thoroughly.', zh: '从容地吃，稳重，仔细享受每一口。' } },
    { id: 'Hectic', name: 'Dồn dập', icon: '⚡', descriptions: { vi: 'Ăn nhanh, dồn dập, cắn miếng lớn liên tục, nhai vội vã.', en: 'Eating fast, hectic, taking large continuous bites, chewing rapidly.', zh: '快节奏，忙碌地大口吃，快速咀嚼。' } },
    { id: 'Elegant', name: 'Lịch thiệp', icon: '✨', descriptions: { vi: 'Ăn nhẹ nhàng, phong thái sang trọng, cử chỉ lịch sự.', en: 'Eating gently, elegant posture, polite gestures.', zh: '斯文地吃，风格优雅，举止得体。' } },
    { id: 'Messy', name: 'Nhiệt tình', icon: '🤤', descriptions: { vi: 'Ăn say mê, nước sốt dính đầy môi, biểu cảm cực kỳ thèm thuồng.', en: 'Eating passionately, sauce smeared on lips, extremely craving expression.', zh: '吃得津津有味，满脸酱汁，极度渴望的表情。' } },
    { id: 'Gulping', name: 'Nhồm nhoàm', icon: '👄', descriptions: { vi: 'Nhai đầy mồm, phồng má, biểu cảm cực kỳ thỏa mãn khi nhai.', en: 'Gulping, mouth full, puffed cheeks, extremely satisfied expression while chewing.', zh: '大口咀嚼，鼓起面颊，咀嚼时表情极其满足。' } },
    { id: 'Slurping', name: 'Húp sồn sột', icon: '🍜', descriptions: { vi: 'Húp nước dùng hoặc mì sồn sột, tạo âm thanh ASMR đặc trưng.', en: 'Slurping broth or noodles, creating characteristic ASMR sounds.', zh: '呼噜呼噜地喝汤 hoặc 吃面，产生典型的 ASMR 声音。' } },
    { id: 'Spicy', name: 'Cay xè lưỡi', icon: '🌶️', descriptions: { vi: 'Ăn đồ cực cay, vừa ăn vừa hít hà, mặt đỏ bừng, toát mồ hôi.', en: 'Eating extremely spicy food, gasping while eating, red face, sweating.', zh: '大口吃极辣 of 食物，边吃边哈气，脸红流汗。' } },
    { id: 'Gnawing', name: 'Gặm nhiệt tình', icon: '🍗', descriptions: { vi: 'Gặm xương hoặc sườn nhiệt tình, tận hưởng cảm giác xé thịt.', en: 'Gnawing on bones or ribs enthusiastically, enjoying the meat tearing sensation.', zh: '热情地啃骨头 or 肋骨，享受撕裂肉的感觉。' } },
    { id: 'SauceDipping', name: 'Chấm đẫm sốt', icon: '🥫', descriptions: { vi: 'Thao tác từ tốn ở mức độ vừa phải: Rót/đổ nước sốt ra đĩa, chấm đẫm miếng mực hoặc bạch tuộc tươi ngon vào đĩa nước sốt, nhấc lên để nước sốt chảy tí tách rồi từ từ ăn thưởng thức.', en: 'Eating moderately and steadily: Pouring sauce onto a plate, dipping tender squid/octopus deeply into the sauce on the plate, slowly lifting as sauce drips before savoring.', zh: '从容且适度地进食：将酱汁倒入盘中，将鲜嫩 of 鱿鱼/章鱼块深蘸盘中酱汁，缓缓提起让酱汁滴落后细细品尝。' } },
    { id: 'ThoroughMixing', name: 'Trộn đều tay', icon: '🥣', descriptions: { vi: 'Trộn đều liên tục đồ ăn với các loại gia vị, nước sốt rồi mới thưởng thức.', en: 'Thoroughly mixing food with spices and sauces before eating.', zh: '吃前将食物与香料和酱汁充分混合。' } },
    { id: 'SavoringDelicately', name: 'Nhấm nháp thưởng thức', icon: '😋', descriptions: { vi: 'Ăn từng chút một, nhắm mắt tận hưởng hương vị tinh tế của món ăn.', en: 'Eating bit by bit, closing eyes to savor the delicate flavor of the food.', zh: '一点一点地吃，闭上眼睛品味食物的精致美味。' } },
    { id: 'ChopstickAction', name: 'Gắp đũa liên tục', icon: '🥢', descriptions: { vi: 'Gắp đũa liên tục không ngừng nghỉ, thao tác nhanh nhẹn dứt khoát.', en: 'Using chopsticks continuously and rapidly, swift and decisive moves.', zh: '不停且快速地动筷子，动作敏捷果断。' } },
    { id: 'WrappingFood', name: 'Tự biên tự diễn (Tự cuốn)', icon: '🌯', descriptions: { vi: 'Tự tay dùng bánh tráng hoặc rau cuốn thức ăn thật khéo léo, chấm đẫm sốt rồi cắn thưởng thức.', en: 'Meticulously wrapping food in rice paper or vegetable sheets, dipping in sauce and savoring.', zh: '亲手用米纸或蔬菜巧妙地包裹食物，蘸酱后大口品尝。' } },
    { id: 'DeepBiting', name: 'Cắn ngập răng', icon: '👄', descriptions: { vi: 'Cắn ngập răng vào đùi, miếng thịt to hoặc cuộn thức ăn, biểu cảm cực sung sướng.', en: 'Taking giant deep bites into meat chunks or rolls with ecstatic facial expressions.', zh: '大口咬下面包、大块肉 or 卷饼，露出狂喜的表情。' } },
    { id: 'PraisingFood', name: 'Vừa ăn vừa xuýt xoa', icon: '🗣️', descriptions: { vi: 'Vừa ăn vừa gật gù khen ngon, biểu cảm thích thú rạng rỡ và thốt lên trầm trồ.', en: 'Nodding and praising the taste while eating, with an delighted and amazed expression.', zh: '边吃边点头夸赞美味，神情愉悦惊叹。' } },
  ];

  const characterActionStyles = [
    {
      id: 'PlateDipping',
      name: 'Sử dụng đĩa sứ trắng sâu lòng 1cm để đồ nước sốt vào và chấm đồ ăn',
      icon: '🍽️',
      promptInstruction: 'AI BẮT BUỘC mô tả nhân vật sử dụng đĩa sứ màu trắng sâu lòng 1cm để đổ nước sốt vào và chấm ngập đẫm đồ ăn trước khi cho vào miệng nhai.'
    },
    {
      id: 'DirectPouring',
      name: 'Rưới sốt lên trực tiếp đồ ăn và sau đó cầm đồ ăn lên cho vào miệng ăn',
      icon: '🥫',
      promptInstruction: 'AI BẮT BUỘC mô tả nhân vật rưới sốt trực tiếp lên bề mặt đồ ăn và sau đó cầm đồ ăn đẫm sốt lên cho vào miệng nhai.'
    },
    {
      id: 'CameraShowcase',
      name: 'Cầm sản phẩm đưa sát camera giới thiệu rồi đặt xuống bàn',
      icon: '📹',
      promptInstruction: 'AI BẮT BUỘC mô tả ở mốc 0s-3s (Part 1), nhân vật cầm sản phẩm đưa sát vào camera để giới thiệu cận cảnh rồi mới đặt sản phẩm xuống bàn bên cạnh mâm đồ ăn.'
    },
    {
      id: 'NaturalUsage',
      name: 'Sử dụng sản phẩm tự nhiên',
      icon: '✨',
      promptInstruction: 'AI BẮT BUỘC mô tả nhân vật sử dụng sản phẩm một cách tự nhiên, nhẹ nhàng và hợp lý bên cạnh mâm đồ ăn.'
    }
  ];

  const handleDurationChange = (type: 'plus' | 'minus') => {
    if (type === 'plus') setDuration(prev => prev + 12);
    else setDuration(prev => Math.max(12, prev - 12));
  };

  const getFoodDescription = () => {
    return {
      vi: customFood || "Chủ đề tùy chọn tự do",
      en: customFood || "Main custom dish chosen by user",
      zh: customFood || "用户自定义主要菜品"
    };
  };

  const handleSuggestFoodSize = async () => {
    const currentFood = customFood || "Xúc tu bạch tuộc";
    setIsSuggestingSize(true);
    try {
      const suggestedText = await executeAiWithFallback(apiKeys, activeApiKeyIndex, setActiveApiKeyIndex, async (genAI) => {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Bạn là một chuyên gia sáng tạo kịch bản Mukbang đỉnh cao.
Dựa trên món ăn hiện tại: "${currentFood}" và MỨC ĐỘ KÍCH THƯỚC ĐÃ CHỌN: "${foodSizeLevel}" (gồm các mức: "Vừa", "To", "Khổng lồ"), hãy viết 1 đoạn mô tả chi tiết, chân thực và sinh động về KÍCH THƯỚC MÓN ĂN và DỤNG CỤ ĐỰNG/ĐỔ NƯỚC SỐT CHẤM ĐI KÈM đúng chuẩn theo đúng mức độ "${foodSizeLevel}":

- Mức "Vừa": Kích thước đồ ăn vừa vặn cân đối và đi kèm đĩa sứ màu trắng sâu lòng 1cm (hoặc bát/tô) chứa đầy nước sốt (Ví dụ: "Có 5 con mực luộc vừa vặn dài khoảng 20–25 cm, đi kèm 1 đĩa sứ màu trắng sâu lòng 1cm đường kính 20–25 cm chứa đầy nước sốt đỏ sóng sánh...").
- Mức "To": Kích thước đồ ăn to ấn tượng và đi kèm đĩa sứ màu trắng sâu lòng 1cm (hoặc tô/bát) to tương ứng (Ví dụ: "Có 5 con mực ống to luộc chín dài 50–60 cm, đi kèm 1 đĩa sứ màu trắng sâu lòng 1cm to đường kính 35–40 cm tràn ngập nước sốt đỏ óng ánh...").
- Mức "Khổng lồ": Kích thước siêu thực khổng lồ đồ sộ và đi kèm đĩa sứ màu trắng sâu lòng 1cm (hoặc thau/bát khổng lồ) rộng lớn tương ứng (Ví dụ: "Có đúng 5 con mực khổng lồ dài 100–120 cm, đi kèm 1 đĩa sứ màu trắng sâu lòng 1cm đường kính 60–70 cm chứa đầy nước sốt đỏ sóng sánh, đảm bảo cả con mực hay cả đồ ăn được nhúng ngập hoàn toàn và thấm đẫm nước sốt...").

Yêu cầu BẮT BUỘC:
- Chi tiết kích thước món ăn cụ thể (chiều dài cm, đường kính/chiều rộng cm, trọng lượng kg nếu có, so sánh trực quan phù hợp với mức kích thước ${foodSizeLevel}).
- BẮT BUỘC mô tả dụng cụ chứa nước sốt là đĩa sứ màu trắng sâu lòng 1cm (hoặc tô/thau tương ứng) để dùng đổ nước sốt vào; ngoài ra AI cũng có thể mô tả là đổ nước sốt trực tiếp lên đồ ăn và sau đó cầm đồ ăn lên cho vào miệng nhai.
- BẮT BUỘC kết thúc bằng câu: "Giữ nguyên kích thước trong toàn bộ video, không thay đổi chiều dài, không thay đổi độ dày."
- Chỉ trả về duy nhất 1 đoạn văn tiếng Việt ngắn gọn, không có lời mở đầu hay giải thích.`
        });
        return response.text;
      });

      if (suggestedText) {
        setFoodSizeDetails(suggestedText.trim());
      }
    } catch (err) {
      console.error("Lỗi khi tạo gợi ý kích thước:", err);
    } finally {
      setIsSuggestingSize(false);
    }
  };

  const handleSuggestProductAction = async () => {
    if (!productName.trim() && !productImage) {
      alert("Vui lòng nhập tên sản phẩm bán hàng hoặc tải ảnh sản phẩm lên trước.");
      return;
    }
    setIsSuggestingProductAction(true);
    try {
      const selectedChars = charNamesList.slice(0, numCharacters);
      const charInstruction = selectedChars.length === 1
        ? "DANH SÁCH NHÂN VẬT THAM GIA: Duy nhất 1 nhân vật tên là NAM. BẮT BUỘC CHỈ MÔ TẢ HÀNH ĐỘNG DÙNG TÊN 'NAM' (ví dụ: 'NAM dùng tay...'). TUYỆT ĐỐI KHÔNG dùng tên NGỌC, THƯ hay bất kỳ tên nhân vật nào khác."
        : `DANH SÁCH NHÂN VẬT THAM GIA: Gồm ${selectedChars.length} nhân vật là: ${selectedChars.join(', ')}. BẮT BUỘC CHỈ ĐƯỢC MÔ TẢ HÀNH ĐỘNG DÙNG CÁC TÊN TRONG DANH SÁCH NÀY (${selectedChars.join(', ')}), TUYỆT ĐỐI KHÔNG DÙNG BẤT KỲ TÊN NHÂN VẬT NÀO KHÁC.`;

      let imagePart: any = null;
      if (productImage && productImage.startsWith('data:')) {
        const matches = productImage.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          imagePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
      }

      const promptText = `Bạn là một chuyên gia sáng tạo kịch bản Mukbang & Review sản phẩm.
Dựa trên tên sản phẩm bán hàng: "${productName.trim() || 'Sản phẩm trong ảnh'}"${imagePart ? ' và HÌNH ẢNH SẢN PHẨM đính kèm' : ''}, hãy phân tích kiểu dáng/loại bao bì sản phẩm (chai, hũ, gói, lon, vòi xịt, nắp vặn...) và viết 1 đoạn mô tả hành động sử dụng sản phẩm một cách chân thực, sinh động, chuẩn theo từng thao tác tay của nhân vật (gồm 3-5 câu ngắn gọn, cụ thể từng bước nhỏ như cầm chai/mở nắp/nghiêng rót/xé gói/múc sốt/uống...):

QUAN TRỌNG VỀ TÊN NHÂN VẬT:
${charInstruction}

Ví dụ mẫu chuẩn theo từng trường hợp nhân vật:
- Ví dụ chỉ chọn 1 nhân vật (NAM): "NAM dùng tay phải cầm chắc chai nước chấm. Đưa chai lên phía trên chiếc đĩa. Nghiêng chai khoảng 45 độ. Nước chấm màu cam đỏ chảy chậm thành dòng liên tục xuống đĩa. Sau khi rót đủ lượng nước chấm, NAM dựng thẳng chai rồi đặt lại đúng vị trí bên cạnh đĩa."
- Ví dụ chọn 2 nhân vật (NAM, NGỌC): "NAM dùng tay mở nắp chai sản phẩm. Đưa chai lên nghiêng rót dòng nước sốt lên đĩa thức ăn. NGỌC cầm đũa gắp miếng thịt chấm đẫm vào dòng nước sốt vừa rót. Sau đó NAM đặt chai sản phẩm lại vị trí cũ bên cạnh đĩa."

Yêu cầu:
- Viết 3-5 câu ngắn mô tả trình tự hành động sử dụng sản phẩm "${productName.trim() || 'Sản phẩm trong ảnh'}" tự nhiên và thực tế nhất.
- BẮT BUỘC chỉ sử dụng đúng tên nhân vật trong danh sách (${selectedChars.join(', ')}).
- Trả về DUY NHẤT 1 đoạn văn tiếng Việt, không lời dẫn hay giải thích.`;

      const contentsPayload = imagePart ? [imagePart, { text: promptText }] : promptText;

      const suggestedText = await executeAiWithFallback(apiKeys, activeApiKeyIndex, setActiveApiKeyIndex, async (genAI) => {
        const response = await genAI.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: contentsPayload
        });
        return response.text;
      });

      if (suggestedText) {
        setProductActionDescription(suggestedText.trim());
      }
    } catch (err) {
      console.error("Lỗi khi gợi ý hành động sản phẩm:", err);
    } finally {
      setIsSuggestingProductAction(false);
    }
  };

  const restoreHistoryParams = (item: HistoryItem) => {
    const p = item.params;
    if (p) {
      if (p.numCharacters) setNumCharacters(p.numCharacters);
      if (p.outfitMode) setOutfitMode(p.outfitMode);
      if (p.outfitNam !== undefined) setOutfitNam(p.outfitNam);
      if (p.outfitNgoc !== undefined) setOutfitNgoc(p.outfitNgoc);
      if (p.outfitThu !== undefined) setOutfitThu(p.outfitThu);
      if (p.settingMode) setSettingMode(p.settingMode);
      if (p.customSetting !== undefined) setCustomSetting(p.customSetting);
      if (p.customFood !== undefined) setCustomFood(p.customFood);
      if (p.foodSizeLevel) setFoodSizeLevel(p.foodSizeLevel);
      if (p.foodSizeDetails !== undefined) setFoodSizeDetails(p.foodSizeDetails);
      if (p.duration) setDuration(p.duration);
      if (p.isCommerceMode !== undefined) setIsCommerceMode(p.isCommerceMode);
      if (p.productName !== undefined) setProductName(p.productName);
      if (p.productActionDescription !== undefined) setProductActionDescription(p.productActionDescription);
      if (p.cameraStyle) setCameraStyle(p.cameraStyle);
      if (p.eatingStyle) setEatingStyle(p.eatingStyle);
      if (p.generationMode) setGenerationMode(p.generationMode);
      if (p.dialogueInput !== undefined) setDialogueInput(p.dialogueInput);
      if (p.isDialogueEnabled !== undefined) setIsDialogueEnabled(p.isDialogueEnabled);
    }
    if (item.generatedPrompts) {
      setGeneratedPrompts(item.generatedPrompts);
    }
    setShowHistoryModal(false);
  };

  const generatePrompts = async () => {
    if (apiKeys.length === 0) {
      alert("Vui lòng nhập API Key để sử dụng các tính năng AI của hệ thống.");
      setShowApiKeyModal(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedPrompts(null);
    const sessionSeed = Math.floor(Math.random() * 1000000);
    const numPrompts = Math.floor(duration / 12);

    const themeName = customFood || "Món ăn tùy chọn";
    const eatingName = eatingStyles.find(es => es.id === eatingStyle)?.name;
    const eatingDesc = eatingStyles.find(es => es.id === eatingStyle)?.descriptions.vi;
    const cameraObj = cameraStyles.find(c => c.id === cameraStyle);
    const cameraName = cameraObj?.name;
    const cameraDesc = cameraObj?.descriptions.vi;

    let extraThemeInstruction = '';

    const hasProductAction = isCommerceMode && productActionDescription.trim().length > 0;
    const defaultProductAction = "đặt cố định 1 vị trí cạnh đồ ăn, hiển thị rõ thông tin sản phẩm và logo trong khung hình video";
    const commerceInstruction = isCommerceMode ? `
- TÍCH HỢP SẢN PHẨM BÁN HÀNG VÀO CÁC CẢNH DIỄN XUẤT CỦA NHÂN VẬT:
  1. TUYỆT ĐỐI KHÔNG sử dụng tên thật của sản phẩm ("${productName}") trong bất kỳ câu kịch bản hay mô tả hành động, timeline nào. Thay vào đó, bắt buộc phải dùng từ gọi chung là "sản phẩm" (cho Tiếng Việt), "product" (cho Tiếng Anh), "产品" (cho Tiếng Trung).
  ${hasProductAction
    ? `2. HÀNH ĐỘNG SỬ DỤNG SẢN PHẨM CỦA NHÂN VẬT CHỈ XUẤT HIỆN Ở MỐC 0s-3s (PART 1): Ở mốc 0s-3s của Part 1, nhân vật BẮT BUỘC thực hiện chi tiết hành động tương tác/sử dụng sản phẩm theo quy trình: "${productActionDescription.trim()}". Sau khi hoàn thành hành động ở mốc 0s-3s, sản phẩm được đặt cố định lại trên bàn bên cạnh đĩa thức ăn. TỪ MỐC 3s-6s TRỜ ĐI (VÀ Ở TẤT CẢ CÁC PART TIẾP THEO), TUYỆT ĐỐI KHÔNG CÒN BẤT KỲ HÀNH ĐỘNG TƯƠNG TÁC HAY CẦM NẮM SẢN PHẨM NÀO NỮA, KỊCH BẢN TẬP TRUNG HOÀN TOÀN VÀO VIỆC NHÂN VẬT ĂN UỐNG LIÊN TỤC.`
    : `2. HÀNH ĐỘNG SỬ DỤNG SẢN PHẨM (Ở MỐC 0s-3s PART 1): Ở mốc 0s-3s của Part 1, mô tả 1 hành động sử dụng sản phẩm tự nhiên dựa vào việc phân tích hình ảnh sản phẩm và tên sản phẩm ("${productName}") ở phần thiết lập phía trên. Sau mốc 0s-3s, sản phẩm được đặt cố định bên cạnh đĩa thức ăn.`}
` : '';

    const multiCharInstruction = numCharacters >= 2 ? `
- HÀNH ĐỘNG ${numCharacters} NHÂN VẬT CÙNG ĂN (BẮT BUỘC CHÂN THỰC): Khi chọn ${numCharacters} nhân vật tham gia (${charNamesList.slice(0, numCharacters).join(', ')}), kịch bản ở TẤT CẢ các cảnh BẮT BUỘC mô tả các nhân vật CÙNG THAM GIA ĂN VÀ THỰC HIỆN CÁC THAO TÁC CÙNG NHAU HOẶC PHỐI HỢP NHAU MỘT CÁCH CHÂN THẬT VÀ TỰ NHIÊN NHẤT (ví dụ: NAM gắp miếng thức ăn nhúng đẫm sốt cắn một miếng lớn, cùng lúc NGỌC dùng kẹp gắp đồ ăn đút/đưa cho THƯ hoặc cả hai/ba cùng chấm đẫm sốt và cắn nhai mỉm cười hào hứng). Tuyệt đối không để xảy ra tình trạng chỉ 1 người ăn còn những người khác ngồi im không thao tác.
` : '';

    const antiDistortionInstruction = `
- TUYỆT ĐỐI CHỐNG BIẾN DẠNG ĐỒ ĂN VÀ SẢN PHẨM (CRITICAL):
  1. Mâm đồ ăn, nguyên liệu và sản phẩm bán hàng BẮT BUỘC phải duy trì nguyên vẹn hình dáng, kích thước, màu sắc và cấu trúc vật lý chân thật nhất trong suốt tất cả các cảnh.
  2. Tuyệt đối CHỐNG TẤT CẢ LỖI BIẾN DẠNG: Đồ ăn không tự nhiên phình to hay co rút bất thường, không tự biến đổi thành món khác, sản phẩm không bị méo mó/móp méo/mất logo, nhân vật không bị méo mó khuôn mặt hay dị dạng tay chân. Tất cả hành động tuân theo quy tắc vật lý chân thực.
`;

    const characterOutfitsList: string[] = [];
    if (numCharacters >= 1) characterOutfitsList.push(`NAM: ${outfitNam.trim() || 'Trang phục năng động'}`);
    if (numCharacters >= 2) characterOutfitsList.push(`NGỌC: ${outfitNgoc.trim() || 'Trang phục trẻ trung'}`);
    if (numCharacters >= 3) characterOutfitsList.push(`THƯ: ${outfitThu.trim() || 'Trang phục thoải mái'}`);

    const outfitInstruction = outfitMode === 'Cameo'
      ? `\n- TRANG PHỤC: Hãy điền giá trị "suggestedOutfit" là "${charNamesList.slice(0, numCharacters).join(', ')}" trong kịch bản.`
      : ((outfitNam || outfitNgoc || outfitThu)
          ? `\n- TRANG PHỤC: BẮT BUỘC sử dụng chính xác mô tả trang phục riêng biệt đã nhập cho từng nhân vật như sau: "${characterOutfitsList.join('; ')}". Hãy điền đúng trang phục riêng này vào trường "suggestedOutfit" và thể hiện rõ trong kịch bản.`
          : (customOutfit 
              ? `\n- TRANG PHỤC: Sử dụng chính xác trang phục sau cho nhân vật: "${customOutfit}" (Không mô tả dài dòng thêm).`
              : `\n- TRANG PHỤC: Tách riêng mô tả trang phục cụ thể cho từng nhân vật (${charNamesList.slice(0, numCharacters).join(', ')}), ví dụ: "NAM: áo thun đỏ; NGỌC: váy trắng..." (gồm loại áo/quần/váy, màu sắc) phù hợp với chủ đề món ăn.`));

    const directEatingInstruction = "\n- HÀNH ĐỘNG ĂN ĐỒ ĂN DỰA TRÊN MÔ TẢ VÀ DẠNG MÓN ĂN (BẮT BUỘC): AI phải chủ động phân tích tên món ăn và mô tả chi tiết kích thước đồ ăn ở phần chủ đề (${themeName}). AI mô tả hành động nhân vật theo đúng lựa chọn hành động đã chọn. Khi đổ nước sốt, AI dùng đĩa sứ màu trắng sâu lòng 1cm để dùng đổ nước sốt vào, ngoài ra AI cũng có thể mô tả là đổ nước sốt trực tiếp lên đồ ăn và sau đó cầm đồ ăn lên cho vào miệng nhai. Nếu món ăn là mực hoặc mô tả là dạng nguyên con, 'cả con' (ví dụ: '5 con mực', 'con mực khổng lồ'...), dưới hành động nhân vật BẮT BUỘC phải là cầm cả con mực (dùng 2 tay hoặc tay cầm cả con) và chấm/nhúng cả con mực vào đĩa sứ màu trắng sâu lòng 1cm hoặc bát/thau nước sốt (kích thước đĩa/bát sốt khớp theo mức size đồ ăn) để ngập đẫm nước sốt hoặc đổ nước sốt trực tiếp lên con mực rồi cắn ăn cả con mực. Khi chọn bất kỳ mức size nào, đĩa/bát nước sốt cũng được mô tả có kích thước tương ứng theo mức size đó trong chi tiết kích thước món ăn để đảm bảo cả con mực hay đồ ăn được thấm đẫm nước sốt. Khi mô tả là 'khoanh', 'miếng', 'xúc tu bạch tuộc', 'nửa con'... thì AI BẮT BUỘC mô tả hành động nhân vật ăn đúng chuẩn xác theo tên và dạng mô tả đó. Tạo các hành động ăn uống tự nhiên, khớp 100% với tên và mô tả đồ ăn, loại bỏ thao tác chuẩn bị rườm rà.";

    const selectedActionObj = characterActionStyles.find(a => a.id === characterActionStyle || a.name === characterActionStyle) || characterActionStyles[0];
    const characterActionInstruction = `\n- LỰA CHỌN HÀNH ĐỘNG NHÂN VẬT VỚI SẢN PHẨM / NƯỚC SỐT (BẮT BUỘC): AI BẮT BUỘC mô tả hành động của nhân vật theo đúng phương thức đã chọn: "${selectedActionObj.name}". Cụ thể: ${selectedActionObj.promptInstruction}`;

    const cameraInstruction = `\n- TUÂN THỦ NGHIÊM NGẶT GÓC QUAY (BẮT BUỘC): Thông số 【CAMERA】được áp dụng chung cho toàn bộ video theo góc quay đã chọn là "${cameraName}" (${cameraDesc}). TUYỆT ĐỐI LOẠI BỎ góc quay cận cảnh (Macro), chuyển góc máy hay bất kỳ từ ngữ mô tả góc quay nào ra khỏi phần kịch bản hành động nhân vật (timeline). Timeline BẮT BUỘC chỉ tập trung miêu tả thuần túy hành động gắp/cầm và ăn đồ ăn của nhân vật.`;

    const settingInstruction = settingMode === 'Cameo'
      ? "\n- BỐI CẢNH: Sử dụng bối cảnh cameo gốc. Điền giá trị \"suggestedSetting\" là \"Giữ nguyên bối cảnh gốc, môi trường gốc, background gốc, không thay đổi không gian, sử dụng bối cảnh gốc từ cameo\" (và bản dịch tương ứng đối với en/zh)."
      : (customSetting 
          ? `\n- BỐI CẢNH: Yêu cầu bối cảnh: ${customSetting}. Hãy tự gợi ý và mô tả ngắn gọn bối cảnh phù hợp với món ăn và dựa trên yêu cầu.`
          : `\n- BỐI CẢNH: Hãy tự gợi ý và mô tả ngắn gọn bối cảnh (ví dụ: sân hiên nhà cổ, phòng khách hiện đại, bụi tre đồng quê, quán ăn lề đường...) phù hợp với món ăn.`);

    const dialogueInstruction = (isDialogueEnabled && dialogueInput) ? `\n- LỜI THOẠI NHÂN VẬT (Bắt buộc): Ở Cảnh đầu tiên/Part 1, nhân vật NAM phát biểu/nói câu thoại sau bằng tiếng "dùng phong cách giọng nói gốc của cameo": "${dialogueInput}". Hãy ghi nhận hành động nói này và lời thoại này vào mốc thời gian 0-3s ở Timeline Chi Tiết của Part 1.` : '';

    const soundInstruction = "\n- YÊU CẦU ÂM THANH VÀ HÀNH ĐỘNG NHAI (Bắt buộc): TUYỆT ĐỐI LOẠI BỎ các từ ngữ, mô tả hoặc âm thanh liên quan đến nhai giòn, cắn rộp rộp, giòn rụm, giòn sần sật. Không có bất kỳ tiếng động hay tạp âm bên ngoài nào. Chỉ mô tả hành động nhai êm ái, từ tốn, nhẹ nhàng của nhân vật và duy nhất tiếng nhai nhẹ nhàng của nhân vật.";

    const sauceDippingInstruction = eatingStyle === 'SauceDipping'
      ? `\n- LƯU Ý BẮT BUỘC CHO CÁCH ĂN CHẤM ĐẪM SỐT VÀ SỬ DỤNG SẢN PHẨM: Nhân vật ăn với mức độ vừa phải, từ tốn. Khi sử dụng sản phẩm hoặc nước chấm (ở Part 1 mốc 0s-3s), AI mô tả dùng đĩa sứ màu trắng sâu lòng 1cm để dùng đổ nước sốt vào (hoặc mô tả đổ nước sốt trực tiếp lên đồ ăn), hành động của nhân vật BẮT BUỘC dựa vào việc phân tích hình ảnh và tên sản phẩm phía trên phần thiết lập, rồi mới chấm đồ ăn vào đĩa sứ đó hoặc cầm đồ ăn đã rưới sốt lên cho vào miệng nhai. TỪ PROMPT THỨ 2 (PART 2) TRỞ ĐI, TUYỆT ĐỐI KHÔNG CÒN HÀNH ĐỘNG TƯƠNG TÁC HOẶC SỬ DỤNG SẢN PHẨM NỮA.`
      : '';

    const foodSizeInstruction = foodSizeDetails.trim()
      ? `\n- MÔ TẢ KÍCH THƯỚC VÀ ĐỒ ĂN KHỔNG LỒ (BẮT BUỘC): Trong mục "food" (mô tả đồ ăn), BẮT BUỘC phải đưa đúng và đầy đủ thông tin mô tả chi tiết kích thước siêu thực sau đây vào kịch bản: "${foodSizeDetails.trim()}". Hãy giữ nguyên kích thước đồ ăn không đổi trong suốt video và dịch chính xác thông tin kích thước này sang en và zh.`
      : '';

    const formatInstruction = generationMode === 'Fixed'
      ? `\n- Hướng dẫn cho Chế độ Ảnh đồ ăn: Vì đây là chế độ tạo ảnh đồ ăn đơn lẻ, ở trường "timeline", bạn KHÔNG chia theo các cảnh. Thay vào đó, viết 1-2 câu miêu tả sinh động về 1 hành động gắp/ăn món ăn của nhân vật.`
      : `\n- Hướng dẫn cho Chế độ Kịch bản AI: Viết chi tiết, sinh động, tập trung hoàn toàn vào hành động ăn uống liên tục của nhân vật. BẮT BUỘC chia kịch bản mỗi phần thành 4 cảnh (3s mỗi cảnh) tương ứng đúng 4 mốc thời gian: 0s-3s, 3s-6s, 6s-9s, 9s-12s cho cả 3 ngôn ngữ (vi, en, zh).`;

    let aiParts: any[] = [];
    if (true) {
      try {
        const responseStr = await executeAiWithFallback(apiKeys, activeApiKeyIndex, setActiveApiKeyIndex, async (genAI) => {
          const response = await genAI.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: `Bạn là một đạo diễn video Mukbang chuyên nghiệp.
Hãy tạo kịch bản chi tiết cho ${numPrompts} phần liên tiếp của một video Mukbang (Mỗi phần tương ứng 1 kịch bản kéo dài 12s).
Tức là nếu video tổng cộng 24s sẽ có 2 phần, 36s sẽ có 3 phần.

YÊU CẦU QUAN TRỌNG:
- MỖI LẦN XUẤT PHẢI HOÀN TOÀN MỚI LẠ KHÁC NHAU, SÁNG TẠO, KHÔNG LẶP LẠI BẤT CỨ LỜI VĂN HAY KỊCH BẢN MẶC ĐỊNH NÀO TỪ TRƯỚC. KHÔNG THEO LỐI MÒN.
${formatInstruction}
- TỪ PROMPT THỨ 2 (PART 2) TRỞ ĐI: Kịch bản BẮT BUỘC tập trung hoàn toàn vào mô tả dạng nối cảnh và nối hành động kế thừa liền mạch ngay từ hành động ở mốc thời gian 9s-12s của Part trước. Mở đầu mốc 0s-3s của Part 2 trở đi phải mở cảnh tiếp nối trực tiếp hành động trước đó, không lặp lại mô tả chi tiết rườm rà hay thiết lập lại từ đầu. TỪ PROMPT THỨ 2 TRỞ ĐI TUYỆT ĐỐI KHÔNG CÒN HÀNH ĐỘNG TƯƠNG TÁC, RÓT/ĐỔ NƯỚC SỐT HAY RÓT SẢN PHẨM NỮA.
- HÀNH ĐỘNG CỦA NHÂN VẬT VỚI SẢN PHẨM CHỈ XUẤT HIỆN Ở MỐC 0s-3s (PART 1): Nếu có mô tả hành động sử dụng sản phẩm, hành động này CHỈ ĐƯỢC XUẤT HIỆN DUY NHẤT Ở MỐC 0s-3s CỦA PART 1. TỪ MỐC 3s-6s TRỜ ĐI Ở TẤT CẢ CÁC PHẦN (PARTS), TUYỆT ĐỐI KHÔNG LẶP LẠI HÀNH ĐỘNG CẦM NẮM HAY TƯƠNG TÁC VỚI SẢN PHẨM, SẢN PHẨM CHỈ ĐẶT CỐ ĐỊNH TRÊN BÀN BÊN CẠNH ĐĨA THỨC ĂN.
- MÔ TẢ THỨC ĂN VÀ DỤNG CỤ ĐỰNG SỐT (BẮT BUỘC): Dựa hoàn toàn và chính xác vào thông tin nhập ở chủ đề (${themeName}) để mô tả các món ăn có trong thông tin ở chủ đề đó, TUYỆT ĐỐI KHÔNG TỰ Ý THÊM BỚT món ăn hay nguyên liệu nào ngoài thông tin chủ đề. AI dùng đĩa sứ màu trắng sâu lòng 1cm để dùng đổ nước sốt vào (hoặc mô tả đổ nước sốt trực tiếp lên đồ ăn). ${foodSizeDetails.trim() ? `BẮT BUỘC mô tả chi tiết kích thước đồ ăn và đĩa sứ màu trắng sâu lòng 1cm (hoặc bát/thau nước sốt): "${foodSizeDetails.trim()}". Đĩa sứ/bát/thau nước sốt BẮT BUỘC có kích thước tương ứng theo mức size đã chọn để đảm bảo cả con mực hay cả đồ ăn được nhúng ngập hoàn toàn và thấm đẫm nước sốt.` : ''}
- HÀNH ĐỘNG SỬ DỤNG SẢN PHẨM VÀ ĐỔ NƯỚC SỐT (MỐC 0s-3s PART 1): Loại bỏ hoàn toàn hành động gán cứng mở nắp chai nghiêng rót. Ở mốc 0s-3s của Part 1, khi sử dụng nước sốt/sản phẩm, AI BẮT BUỘC thực hiện theo đúng tùy chọn hành động đã chọn là: "${selectedActionObj.name}". ${selectedActionObj.promptInstruction} Hành động sử dụng sản phẩm BẮT BUỘC dựa vào việc phân tích hình ảnh sản phẩm đã tải lên và tên sản phẩm ở phần thiết lập phía trên.
- NGUYÊN TẮC HÀNH ĐỘNG MỖI CẢNH (3 GIÂY = 1 HÀNH ĐỘNG CHÍNH + 1 HÀNH ĐỘNG PHỤ): Mỗi Cảnh (kéo dài 3 giây, gồm 4 mốc: 0s-3s, 3s-6s, 6s-9s, 9s-12s) BẮT BUỘC chỉ gồm 1 đến 2 hành động ngắn gối đầu liền mạch, áp dụng nguyên tắc: 3 giây = 1 hành động chính + 1 hành động phụ (TUYỆT ĐỐI KHÔNG viết dồn 2-3 hành động chính phức tạp trong cùng 1 cảnh). Ví dụ: 0s-3s: NAM gắp xúc tu, đồng thời nhúng vào nước chấm; 3s-6s: Đưa lên miệng và cắn một miếng lớn; 6s-9s: Nhai nhẹ nhàng và thể hiện biểu cảm ngon miệng.
- PHÂN TÍCH VÀ PHÁT SINH HÀNH ĐỘNG ĂN KHỚP VỚI MÔ TẢ VÀ DẠNG MÓN ĂN: AI BẮT BUỘC phân tích kỹ mô tả đồ ăn, kích thước và tên món ăn ở chủ đề (${themeName}). AI BẮT BUỘC mô tả hành động nhân vật tuân thủ tùy chọn đã chọn: "${selectedActionObj.name}". AI dùng đĩa sứ màu trắng sâu lòng 1cm để dùng đổ nước sốt vào, ngoài ra AI cũng có thể mô tả là đổ nước sốt trực tiếp lên đồ ăn và sau đó cầm đồ ăn lên cho vào miệng nhai. Nếu món ăn là mực hoặc dạng nguyên con ('cả con', '5 con mực', 'con mực khổng lồ'...) thì hành động nhân vật BẮT BUỘC phải là cầm cả con mực (dùng 2 tay hoặc tay cầm cả con) và chấm/nhúng cả con mực vào đĩa sứ màu trắng sâu lòng 1cm hoặc bát/thau nước sốt (kích thước đĩa/bát sốt khớp theo mức size đã chọn) để ngập đẫm nước sốt hoặc đổ nước sốt trực tiếp lên con mực rồi cắn ăn cả con mực. Khi mô tả là 'khoanh', 'miếng', 'xúc tu bạch tuộc', 'nửa con'... thì AI BẮT BUỘC phải mô tả hành động nhân vật ăn chuẩn xác theo đúng tên gọi và dạng mô tả món ăn đó.
- TUÂN THỦ NGHIÊM NGẶT GÓC QUAY: Thông số 【CAMERA】được áp dụng chung cố định cho toàn bộ video theo góc quay đã chọn: "${cameraName}" (${cameraDesc}). TUYỆT ĐỐI LOẠI BỎ mọi từ ngữ hay câu lệnh mô tả góc quay cận cảnh (Macro), zoom camera, hay chuyển góc camera ra khỏi phần kịch bản hành động nhân vật trong timeline. Timeline BẮT BUỘC chỉ tập trung miêu tả thuần túy hành động gắp/cầm và ăn đồ ăn của nhân vật.
- TÁCH RIÊNG TRANG PHỤC TỪNG NHÂN VẬT: Phần "suggestedOutfit" BẮT BUỘC phải tách riêng rõ ràng mô tả trang phục riêng biệt cho từng nhân vật trong số ${numCharacters} nhân vật tham gia (${charNamesList.slice(0, numCharacters).join(', ')}), ví dụ: "NAM: áo thun đỏ; NGỌC: áo sơ mi trắng...".
- TẬP TRUNG ĂN LIÊN TỤC TỪ MỐC 3s-6s TRỜ ĐI (BẮT BUỘC): Từ mốc 3s-6s trở đi ở mỗi phần, kịch bản BẮT BUỘC phải tập trung hoàn toàn vào việc nhân vật ăn uống liên tục không ngừng nghỉ (liên tục gắp/cầm đồ ăn, nhúng/chấm sốt, đưa vào miệng, cắn, nhai nhẹ nhàng và lập tức gắp tiếp con/miếng tiếp theo). Tuyệt đối không chèn bất kỳ hành động thừa hay tạm dừng nào không phải là hành động ăn uống.
- MÔ TẢ HÀNH ĐỘNG ĐƠN GIẢN & ĂN LIÊN TỤC PHÙ HỢP MÓN ĂN: Mô tả hành động nhân vật tập trung ở từng cảnh dựa đúng trên phân tích đặc điểm món ăn (dùng đũa/thìa/kẹp hoặc tay cầm đồ ăn lên, chấm/nhúng nước sốt nếu có, đưa vào miệng cắn/nhai thưởng thức, rồi lập tức lấy con/miếng tiếp theo). TUYỆT ĐỐI KHÔNG mô tả bóc tách hay thao tác phụ rườm rà.
- TIẾN TRÌNH VƠI ĐỒ ĂN CHI TIẾT THEO DẠNG MÓN ĂN: AI phải miêu tả cụ thể đơn vị/dạng món ăn (ví dụ: cả con bạch tuộc số 1, khoanh mực số 2, xúc tu bạch tuộc, miếng thịt, nửa con...) đang được nhân vật gắp và ăn ở từng cảnh. Ngay sau khi nhân vật ăn đơn vị đó, mâm đồ ăn ở cảnh tiếp theo BẮT BUỘC phải được mô tả rõ ràng là đã vơi đi chính xác đơn vị/dạng món ăn đó.
- LOẠI BỎ MÔ TẢ GIÒN: TUYỆT ĐỐI KHÔNG sử dụng các từ ngữ hay âm thanh nhai giòn, cắn rộp rộp, giòn rụm, giòn sần sật. Tất cả hành động nhai đều là nhai êm ái, nhẹ nhàng và thưởng thức vị tươi ngon mềm mọng.
- GIỮ NGUYÊN TÊN NHÂN VẬT: Không dịch hay thay đổi tên NAM, NGỌC, THƯ trong bất kỳ ngôn ngữ nào (kể cả Tiếng Anh và Tiếng Trung).
- SỐ LƯỢNG NHÂN VẬT: Có ${numCharacters} nhân vật tham gia là: ${charNamesList.slice(0, numCharacters).join(', ')}. Hãy phân chia hành động ăn uống và tương tác hợp lý giữa họ.
- ĐỒ NG NHẤT CẤU TRÚC PROMPT: Timeline của tiếng Anh (en) và tiếng Trung (zh) bắt buộc phải có cấu trúc thời gian/cảnh khớp hoàn toàn với tiếng Việt (vi). Không thêm các tiêu đề giải thích rườm rà. TUYỆT ĐỐI KHÔNG đặt tên thiết bị/thực phẩm/sản phẩm cụ thể là "${productName}" ở bất cứ đâu trong timeline hay mô tả hành động kịch bản, hãy luôn luôn gọi chung là "sản phẩm" (vi), "product" (en), "product" (zh)...

Thông số kịch bản:
- Món ăn chủ đạo: ${themeName}
- Cách ăn/Phong cách ăn: ${eatingName} (${eatingDesc})
- Góc quay: ${cameraName} (${cameraDesc})
- Lựa chọn hành động nhân vật: ${selectedActionObj.name}

Các chỉ dẫn bổ sung if any:${outfitInstruction}${settingInstruction}${commerceInstruction}${multiCharInstruction}${antiDistortionInstruction}${dialogueInstruction}${sauceDippingInstruction}${soundInstruction}${directEatingInstruction}${cameraInstruction}${extraThemeInstruction}${foodSizeInstruction}${characterActionInstruction}

Hãy tạo kịch bản cho tất cả ${numPrompts} phần và điền đầy đủ thông tin dịch thuật sang 3 ngôn ngữ (vi, en, zh).
Trả về ĐÚNG MỘT MẢNG JSON, không có text dư thừa, không có thẻ markdown như \`\`\`json. Cấu trúc mảng JSON chính xác như sau:
[
  {
    "food": {
      "vi": "Mô tả đồ ăn dựa đúng thông tin ở chủ đề đã nhập, không tự thêm bớt...",
      "en": "...",
      "zh": "..."
    },
    "timeline": {
      "vi": "0s-3s: ...\\n3s-6s: ...\\n6s-9s: ...\\n9s-12s: ...",
      "en": "0s-3s: ...\\n3s-6s: ...\\n6s-9s: ...\\n9s-12s: ...",
      "zh": "0s-3s: ...\\n3s-6s: ...\\n6s-9s: ...\\n9s-12s: ..."
    },
    "suggestedOutfit": {
      "vi": "Tách riêng mô tả trang phục từng nhân vật (VD: NAM: áo thun đỏ; NGỌC: váy trắng...)",
      "en": "Describe distinct outfit separately for each person",
      "zh": "分别描述每个角色的服装"
    },
    "suggestedSetting": {
      "vi": "Mô tả bối cảnh ngắn gọn",
      "en": "...",
      "zh": "..."
    },
    "asmrSound": {
      "vi": "Chỉ có ASMR chân thực gồm tiếng nhai, tiếng nuốt, tiếng thịt mềm mọng khi cắn, tiếng nước chấm nhỏ xuống đĩa và tiếng va chạm nhẹ của dụng cụ ăn.",
      "en": "Only authentic ASMR including chewing, swallowing, juicy meat biting, sauce dripping onto the dish, and soft utensil clinking sounds.",
      "zh": "只有真实的 ASMR，包括咀嚼声、吞咽声、咬鲜嫩肉质的声音、酱汁滴到盘子上的声音以及餐具轻微碰撞的声音。"
    },
    "suggestedMood": {
      "vi": "Mô tả cảm xúc và cách ăn",
      "en": "...",
      "zh": "..."
    }
  }
]
`
          });
          return response.text;
        });
        if (responseStr) {
           aiParts = cleanJson(responseStr);
        }
      } catch (e: any) {
        console.error("AI Generation failed:", e);
        alert("Lỗi khi kết nối AI tạo kịch bản: " + e.message);
        setIsGenerating(false);
        return;
      }
    } else {
      aiParts = Array(numPrompts).fill({
        food: { vi: '...', en: '...', zh: '...' },
        timeline: { vi: '...', en: '...', zh: '...' }
      });
    }

    const promptList: any[] = [];

    for (let i = 0; i < numPrompts; i++) {
        const aiPart = aiParts[i] || aiParts[0]; // fallback safely if length mismatch

        const createPromptForLang = (langKey: "vi" | "en" | "zh") => {
          const isVi = langKey === "vi";
          const isEn = langKey === "en";

          // THIẾT LẬP
          const thietLapStr = isVi
            ? `THIẾT LẬP: Video dài khoảng 12 giây, chỉ có một cảnh liên tục, không chuyển cảnh, ${isDialogueEnabled ? 'có lời thoại nhân vật' : 'không lời thoại'}, không chữ trên màn hình, không phụ đề, không watermark, không logo, phong cách điện ảnh siêu chân thực, chất lượng 8K Ultra Realistic, HDR, DSLR, siêu sắc nét, chi tiết cao, màu sắc tự nhiên.`
            : (isEn
                ? `SETUP: Video length about 12 seconds, single continuous shot, no scene cuts, ${isDialogueEnabled ? 'character dialogue included' : 'no dialogue'}, no text on screen, no subtitles, no watermark, no logo, ultra-realistic cinematic style, 8K Ultra Realistic quality, HDR, DSLR, super sharp, high detail, natural colors.`
                : `设置: 视频时长约 12 秒，单一连续镜头，无剪辑，${isDialogueEnabled ? '包含角色对话' : '无对话'}，屏幕上无文字，无字幕，无水印，无Logo，超逼真电影风格，8K Ultra Realistic 画质，HDR，DSLR，超清晰，高细节，自然色彩。`);

          // [BỐI CẢNH]
          const settingVal = settingMode === 'Cameo'
            ? {
                vi: "Giữ nguyên bối cảnh gốc từ cameo, không thay đổi không gian",
                en: "Keep original setting from cameo, do not change space",
                zh: "保持Cameo原始背景，不改变空间"
              }[langKey]
            : (generationMode === 'Fixed'
                ? (customSetting || {
                    vi: "Phòng ăn ấm cúng phong cách tối giản, hậu cảnh gọn gàng sạch sẽ.",
                    en: "Cozy minimalist dining room, neat and clean background.",
                    zh: "温馨简约的餐厅，背景整洁干净。"
                  }[langKey])
                : (aiPart?.suggestedSetting?.[langKey] || {
                    vi: "Một góc căn nhà mộc mạc, bàn gỗ tự nhiên, không gian sạch sẽ, ban ngày với ánh sáng tự nhiên mềm mại.",
                    en: "A rustic corner, natural wooden table, clean space, daytime soft natural lighting.",
                    zh: "朴素的角落，天然木桌，干净的空间，白天柔和的自然光线。"
                  }[langKey])
              );
          const boiCanhHeader = isVi ? "[BỐI CẢNH]:" : (isEn ? "[SETTING]:" : "[背景]:");

          // TRANG PHỤC
          const outfitStr = outfitMode === 'Cameo'
            ? {
                vi: "Giữ nguyên trang phục gốc từ cameo",
                en: "Keep original outfit from cameo",
                zh: "保持Cameo原始服装"
              }[langKey]
            : (generationMode === 'Fixed'
                ? (customOutfit || {
                    vi: "Trang phục đơn giản, lịch sự.",
                    en: "Simple, polite outfit.",
                    zh: "简约得体的服装。"
                  }[langKey])
                : (aiPart?.suggestedOutfit?.[langKey] || {
                    vi: "Trang phục phù hợp.",
                    en: "Suggested outfit.",
                    zh: "合适的服装。"
                  }[langKey])
              );
          const trangPhucHeader = isVi ? "TRANG PHỤC:" : (isEn ? "OUTFIT:" : "服装:");

          // 【THỨC ĂN】
          const foodHeader = isVi ? "【THỨC ĂN】" : (isEn ? "【FOOD】" : "【食物】");
          const foodStr = aiPart?.food?.[langKey] || '...';

          // 【SẢN PHẨM】
          let productStr = '';
          if (isCommerceMode) {
            const productHeader = isVi ? "【SẢN PHẨM】" : (isEn ? "【PRODUCT】" : "【产品】");
            const productBody = {
              vi: `Sản phẩm "${productName || 'SP'}" đặt trên bàn bên cạnh đĩa thức ăn, hiển thị rõ ràng thông tin và logo. Giữ nguyên tuyệt đối theo ảnh tham chiếu đã tải lên, không thay đổi logo, màu sắc, chất liệu, kích thước, tỷ lệ, thiết kế, cấu trúc, chữ in, bao bì hay hình dáng. Không được thay thế hoặc tự tạo phiên bản khác, không làm biến dạng sản phẩm.`,
              en: `Product "${productName || 'SP'}" placed on the table next to the food plate, clearly displaying information and logo. Keep strictly identical to the uploaded reference image, do not change logo, color, material, size, ratio, design, structure, printed text, packaging or shape. Do not replace, generate a different version, or distort the product.`,
              zh: `产品 "${productName || 'SP'}" 放在食物盘旁边的桌子上，清晰显示信息和 Logo。严格按照上传的参考图片保持一致，不更改 Logo、颜色、材质、尺寸、比例、设计、结构、印刷文字、包装或外形。切勿替换、生成其他版本或歪曲产品。`
            }[langKey];
            productStr = `${productHeader}${productBody}\n\n`;
          }

          // 【CAMERA】
          const cameraHeader = "【CAMERA】";
          const cameraSelectedObj = cameraStyles.find(c => c.id === cameraStyle);
          const cameraVal = {
            vi: cameraStyle === 'TopDown' 
              ? `Camera cố định ở góc nhìn từ trên xuống khoảng 45 độ, không zoom, không pan, không tilt, không xoay, không rung, không thay đổi góc quay trong toàn bộ video.`
              : `Camera cố định ở góc nhìn ${cameraSelectedObj?.name || 'chuẩn'}, không zoom, không pan, không tilt, không xoay, không rung, không thay đổi góc quay trong toàn bộ video.`,
            en: cameraStyle === 'TopDown'
              ? `Camera fixed at a top-down view of around 45 degrees, no zoom, no pan, no tilt, no rotation, no camera shake, keeping the camera angle unchanged throughout the video.`
              : `Camera fixed at ${cameraSelectedObj?.name || 'standard'} view, no zoom, no pan, no tilt, no rotation, no camera shake, keeping the camera angle unchanged throughout the video.`,
            zh: cameraStyle === 'TopDown'
              ? `相机固定在大约45度的俯视视角，无缩放，无平移，无倾斜，无旋转，无相机抖动，在整个视频中保持相机角度不变。`
              : `相机固定在${cameraSelectedObj?.name || '标准'}视角，无缩放，无平移，无倾斜，无旋转，无相机抖动，在整个视频中保持相机角度不变。`
          }[langKey];

          // 【ÂM THANH】
          const soundHeader = isVi ? "【ÂM THANH】" : (isEn ? "【SOUND】" : "【声音】");
          const soundVal = (generationMode !== 'Fixed' && aiPart?.asmrSound?.[langKey])
            ? aiPart.asmrSound[langKey]
            : {
                vi: "Chỉ có ASMR chân thực gồm tiếng nhai, tiếng nuốt, tiếng thịt mềm mọng khi cắn, tiếng nước chấm nhỏ xuống đĩa và tiếng va chạm nhẹ của dụng cụ ăn.",
                en: "Only authentic ASMR including chewing, swallowing, juicy meat biting, sauce dripping onto the dish, and soft utensil clinking sounds.",
                zh: "只有真实的 ASMR，包括咀嚼声、吞咽声、咬鲜嫩肉质的声音、酱汁滴到盘子上的声音以及餐具轻微碰撞的声音。"
              }[langKey];

          // 【KỊCH BẢN】
          const kichBanHeader = isVi ? "【KỊCH BẢN】" : (isEn ? "【SCRIPT】" : "【剧本】");
          let timelineContent = aiPart?.timeline?.[langKey] || '...';

          // 【NEGATIVE PROMPT】
          const negativePromptHeader = "【NEGATIVE PROMPT】";
          const negativePromptVal = {
            vi: "Không chữ, không phụ đề",
            en: "No text, no subtitles",
            zh: "无文字，无字幕"
          }[langKey];

          // Build final prompt
          let finalPrompt = `${thietLapStr}\n\n`;
          finalPrompt += `${boiCanhHeader} ${settingVal}\n\n`;
          finalPrompt += `${trangPhucHeader} ${outfitStr}\n\n`;
          finalPrompt += `${foodHeader}${foodStr}\n\n`;
          if (productStr) {
            finalPrompt += productStr;
          }
          finalPrompt += `${cameraHeader}${cameraVal}\n\n`;
          finalPrompt += `${soundHeader}${soundVal}\n\n`;
          finalPrompt += `${kichBanHeader}\n${timelineContent}\n\n\n`;
          finalPrompt += `${negativePromptHeader}${negativePromptVal}`;

          return cleanUnwantedPrefixes(finalPrompt);
        };

        promptList.push({
          id: sessionSeed + i,
          index: i + 1,
          vi: createPromptForLang('vi'),
          en: createPromptForLang('en'),
          zh: createPromptForLang('zh')
        });
    }

    setGeneratedPrompts(promptList);

    const newHistoryItem: HistoryItem = {
      id: 'hist_' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      foodName: customFood || 'Món ăn Mukbang',
      foodSizeLevel,
      numCharacters,
      duration,
      isCommerceMode,
      productName,
      productActionDescription,
      generatedPrompts: promptList,
      params: {
        numCharacters, outfitMode, outfitNam, outfitNgoc, outfitThu, settingMode, customSetting, customFood, foodSizeLevel, foodSizeDetails, duration, isCommerceMode, productName, productActionDescription, cameraStyle, eatingStyle, generationMode, dialogueInput, isDialogueEnabled
      }
    };
    setHistoryList(prev => [newHistoryItem, ...prev].slice(0, 30));

    setIsGenerating(false);
  };

  const copyToClipboard = (text: string, key: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadAllPrompts = () => {
    if (!generatedPrompts) return;
    
    let content = "=== CHUỖI PROMPT MUKBANG ===\n\n";
    generatedPrompts.forEach((prompt, idx) => {
      content += `PART ${idx + 1}\n`;
      content += `--------------------------\n`;
      content += `[TIẾNG VIỆT]\n${prompt.vi}\n\n`;
      content += `[ENGLISH]\n${prompt.en}\n\n`;
      content += `[CHINESE]\n${prompt.zh}\n\n`;
      content += `==========================\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mukbang_prompts_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const validCredentials = {
      "0981028794": "6789",
      "0395080698": "123456",
      "0389467268": "123456",
      "0342596096": "123456",
      "0386434509": "123456",
      "+420702009109": "123456",
      "0942987566": "123456",
      "HV7": "123456",
      "HV8": "123456",
      "HV9": "123456",
      "HV10": "123456"
    };

    if (validCredentials[loginUsername as keyof typeof validCredentials] === loginPassword) {
      setIsAuthenticated(true);
      const now = Date.now();
      localStorage.setItem('mukbangAppAuth', 'true');
      localStorage.setItem('mukbangAppAuthTime', now.toString());
      setLoginTime(now);
      setLoginError('');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050507] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.18),rgba(0,0,0,0))] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white">
        <div className="bg-neutral-950/90 backdrop-blur-2xl border border-orange-500/30 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(249,115,22,0.12)] animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 transform rotate-3 border border-orange-400/40">
              <Key size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black uppercase text-center mt-2 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent tracking-wide">
              Đăng nhập hệ thống
            </h2>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Tên đăng nhập</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm placeholder-neutral-600"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Mật khẩu</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm placeholder-neutral-600"
                required
              />
            </div>

            {loginError && (
              <p className="text-red-400 text-sm text-center font-medium bg-red-950/40 border border-red-800/50 py-2 rounded-lg">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-950/50 active:scale-95 mt-4 tracking-wide"
            >
              Đăng nhập
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-800/80 text-center">
            <p className="text-sm text-neutral-400 leading-relaxed">
              Liên hệ Admin Nam <br/><span className="text-orange-400 font-bold text-base">0981028794</span> để được cấp mật khẩu
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050507] bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(249,115,22,0.16),rgba(0,0,0,0))] text-white p-4 sm:p-6 font-sans flex flex-col items-center pb-32 selection:bg-orange-500 selection:text-white">
      {/* Top Glass Header */}
      <header className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-4 py-3 px-5 rounded-2xl bg-neutral-950/80 backdrop-blur-2xl border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.06)] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30">
            <Utensils className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 bg-clip-text text-transparent uppercase">
              NAM AI MUKBANG
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium hidden sm:block">Kịch Bản Mukbang Khổng Lồ • Chuẩn Timeline Logic</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="text-xs font-extrabold text-amber-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 border border-amber-500/30 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <History size={13} className="text-amber-400" /> Lịch sử ({historyList.length})
          </button>

          <button 
            onClick={() => setShowApiKeyModal(true)}
            className="text-xs font-extrabold text-orange-400 hover:text-amber-300 flex items-center gap-1.5 px-3 py-1.5 bg-orange-950/40 border border-orange-500/30 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Key size={13} className="text-orange-400" /> API Keys ({apiKeys.length})
          </button>

          {remainingTime && (
            <div className="bg-neutral-900/90 border border-amber-500/30 rounded-xl py-1 px-3 flex items-center gap-2 shadow-sm">
              <Clock size={12} className="text-orange-400" />
              <div className="flex flex-col">
                <span className="text-[7px] font-extrabold text-neutral-400 uppercase leading-none">Hết hạn</span>
                <span className="text-xs font-black text-amber-300 font-mono leading-none mt-0.5">{remainingTime}</span>
              </div>
            </div>
          )}

          <button 
            onClick={() => {
              setIsAuthenticated(false);
              setLoginTime(null);
              localStorage.removeItem('mukbangAppAuth');
              localStorage.removeItem('mukbangAppAuthTime');
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center transition-all active:scale-95"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-neutral-950 border border-orange-500/40 rounded-3xl p-6 w-full max-w-lg shadow-2xl shadow-orange-950/40 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4 text-orange-400">
              <Key size={24} />
              <h2 className="text-xl font-black uppercase tracking-wide">Cấu hình API Key (AI)</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
              Vui lòng nhập danh sách API Key của Google Gemini để sử dụng tính năng tạo và dịch tự động. 
              Mỗi API Key nằm trên 1 dòng. Hệ thống sẽ tự động dùng luân phiên nếu có key bị lỗi hoặc hết hạn.
            </p>
            <textarea
              value={tempApiKeysInput}
              onChange={(e) => setTempApiKeysInput(e.target.value)}
              placeholder={`AIzaSy...\nAIzaSy...\nAIzaSy...`}
              className="w-full h-32 bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 text-xs font-mono text-orange-300 mb-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-colors"
            ></textarea>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveApiKeys}
                className="w-full py-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 rounded-xl font-bold text-white shadow-lg shadow-orange-950/50 active:scale-95 transition-all"
              >
                Lưu Danh Sách API Key
              </button>
              <a 
                href="https://aistudio.google.com/api-keys" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-center text-orange-400 hover:text-amber-300 underline underline-offset-2 flex items-center justify-center gap-1 mt-1"
              >
                <Link size={12} /> HD lấy API KEY MIỄN PHÍ : https://aistudio.google.com/api-keys
              </a>
              {apiKeys.length > 0 && (
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="w-full py-2.5 mt-2 bg-neutral-800/80 rounded-xl font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Sessions Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-neutral-950 border border-orange-500/40 rounded-3xl p-6 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl shadow-orange-950/50">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase text-orange-300 tracking-wide">
                    Lịch Sử Các Phiên Kịch Bản ({historyList.length})
                  </h2>
                  <p className="text-[10px] text-neutral-400">Xem lại các kịch bản đã khởi tạo trước đó và khôi phục thông số dễ dàng</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {historyList.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử không?")) {
                        setHistoryList([]);
                      }
                    }}
                    className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 size={13} /> Xóa tất cả
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* History Items Container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {historyList.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <FileText size={40} className="mx-auto text-neutral-700" />
                  <p className="text-sm text-neutral-500 font-medium">Chưa có kịch bản nào được lưu trong lịch sử.</p>
                  <p className="text-xs text-neutral-600">Mỗi khi bạn nhấn "XUẤT CHUỖI PROMPT", kịch bản sẽ tự động lưu lại đây.</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-neutral-900/70 border border-neutral-800 hover:border-orange-500/40 p-4 rounded-2xl transition-all space-y-3 shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-extrabold text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                          {item.timestamp}
                        </span>
                        <span className="text-xs font-black text-amber-300">
                          {item.foodName}
                        </span>
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-950/60 border border-orange-500/30 px-2 py-0.5 rounded-md">
                          {item.foodSizeLevel}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                          {item.numCharacters} Người
                        </span>
                        <span className="text-[10px] font-bold text-neutral-300 bg-neutral-950 px-2 py-0.5 rounded-md border border-neutral-800">
                          {item.duration}s ({item.generatedPrompts?.length || Math.ceil(item.duration/12)} Parts)
                        </span>
                        {item.isCommerceMode && item.productName && (
                          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            SP: {item.productName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setGeneratedPrompts(item.generatedPrompts);
                            setShowHistoryModal(false);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center gap-1 active:scale-95"
                        >
                          <Play size={11} fill="currentColor" /> Xem kịch bản
                        </button>

                        <button
                          onClick={() => restoreHistoryParams(item)}
                          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition-all flex items-center gap-1 active:scale-95"
                          title="Khôi phục các tùy chọn form này"
                        >
                          <RotateCcw size={11} /> Nạp thông số
                        </button>

                        <button
                          onClick={() => {
                            setHistoryList(prev => prev.filter(h => h.id !== item.id));
                          }}
                          className="p-1.5 bg-neutral-900 hover:bg-red-950/60 text-neutral-500 hover:text-red-400 rounded-xl border border-neutral-800 transition-all"
                          title="Xóa phiên này"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {item.productActionDescription && (
                      <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-300 leading-relaxed">
                        <strong className="text-orange-400 font-bold block mb-0.5 text-[10px] uppercase">Hành động sản phẩm:</strong>
                        <p className="line-clamp-2 italic text-neutral-400">{item.productActionDescription}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Scientific Dashboard Layout */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Parameters divided into clear scientific steps */}
        <div className="lg:col-span-8 space-y-6">

          {/* STEP 1: Nhân vật & Bối cảnh */}
          <div className="bg-neutral-950/80 backdrop-blur-xl p-5 rounded-3xl border border-orange-500/20 shadow-xl shadow-black/50 hover:border-orange-500/40 transition-all">
            <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-neutral-800/80">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-mono text-xs font-black border border-orange-500/30">01</span>
              <h3 className="text-sm font-black uppercase text-orange-300 tracking-wider">Nhân vật & Bối cảnh</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thành viên */}
              <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2 mb-2.5 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                  <Users size={13} className="text-orange-400" /> Số lượng nhân vật
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(num => (
                    <button 
                      key={num} 
                      type="button"
                      onClick={() => setNumCharacters(num)} 
                      className={`flex-1 py-2 rounded-xl font-extrabold text-xs transition-all ${
                        numCharacters === num 
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/60 border border-orange-400/40' 
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {num} Người
                    </button>
                  ))}
                </div>
              </div>

              {/* Bối cảnh */}
              <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2 mb-2.5 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                  <MonitorPlay size={13} className="text-orange-400" /> Bối cảnh quay
                </div>
                <div className="flex gap-1.5 mb-2">
                  <button 
                    type="button"
                    onClick={() => setSettingMode('Cameo')} 
                    className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      settingMode === 'Cameo' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md border border-orange-400/40' 
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Cameo gốc
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSettingMode('Theme')} 
                    className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      settingMode === 'Theme' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md border border-orange-400/40' 
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Tùy chọn
                  </button>
                </div>
                {settingMode === 'Theme' && (
                  <input
                    type="text"
                    placeholder="Mô tả bối cảnh (VD: Phòng ăn sang trọng, sân vườn...)"
                    value={customSetting}
                    onChange={(e) => setCustomSetting(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-3 text-white focus:outline-none focus:border-orange-500 transition-all text-xs font-medium placeholder-neutral-600"
                  />
                )}
              </div>

              {/* Thời trang */}
              <div className="md:col-span-2 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                    <Shirt size={13} className="text-orange-400" /> Trang phục nhân vật
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      type="button"
                      onClick={() => setOutfitMode('Cameo')} 
                      className={`px-3 py-1 rounded-lg font-extrabold text-[10px] transition-all ${
                        outfitMode === 'Cameo' 
                          ? 'bg-orange-600 text-white shadow-sm border border-orange-400/40' 
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Cameo mặc định
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOutfitMode('Random')} 
                      className={`px-3 py-1 rounded-lg font-extrabold text-[10px] transition-all ${
                        outfitMode === 'Random' 
                          ? 'bg-orange-600 text-white shadow-sm border border-orange-400/40' 
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Tùy chỉnh riêng
                    </button>
                  </div>
                </div>

                {outfitMode === 'Random' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2 animate-in fade-in duration-300">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-400 block mb-1">NAM:</label>
                      <input
                        type="text"
                        placeholder="VD: Áo thun đỏ..."
                        value={outfitNam}
                        onChange={(e) => setOutfitNam(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2.5 text-white focus:outline-none focus:border-orange-500 transition-all text-xs"
                      />
                    </div>
                    {numCharacters >= 2 && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">NGỌC:</label>
                        <input
                          type="text"
                          placeholder="VD: Váy trắng..."
                          value={outfitNgoc}
                          onChange={(e) => setOutfitNgoc(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2.5 text-white focus:outline-none focus:border-orange-500 transition-all text-xs"
                        />
                      </div>
                    )}
                    {numCharacters >= 3 && (
                      <div>
                        <label className="text-[10px] font-bold text-neutral-400 block mb-1">THƯ:</label>
                        <input
                          type="text"
                          placeholder="VD: Áo phông vàng..."
                          value={outfitThu}
                          onChange={(e) => setOutfitThu(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 px-2.5 text-white focus:outline-none focus:border-orange-500 transition-all text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Món ăn & Kích thước */}
          <div className="bg-neutral-950/80 backdrop-blur-xl p-5 rounded-3xl border border-orange-500/20 shadow-xl shadow-black/50 hover:border-orange-500/40 transition-all">
            <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-neutral-800/80">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-mono text-xs font-black border border-orange-500/30">02</span>
              <h3 className="text-sm font-black uppercase text-orange-300 tracking-wider">Món ăn & Mô tả kích thước</h3>
            </div>

            <div className="space-y-4">
              {/* Food Name & Size Selection */}
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-neutral-200 text-xs font-black uppercase tracking-wide">
                    <Star size={13} className="text-orange-400" /> Tên món ăn Mukbang
                  </label>
                  <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <span className="text-[10px] font-extrabold text-neutral-400 uppercase px-1.5">Mức size:</span>
                    {[
                      { id: 'Vừa', label: 'Vừa' },
                      { id: 'To', label: 'To' },
                      { id: 'Khổng lồ', label: 'Khổng lồ' }
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setFoodSizeLevel(lvl.id)}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                          foodSizeLevel === lvl.id
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm border border-orange-400/40'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Nhập món ăn (VD: Xúc tu bạch tuộc, Tôm hùm sốt bơ, Mực ống...)"
                  value={customFood}
                  onChange={(e) => setCustomFood(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-orange-500 transition-all text-sm font-medium placeholder-neutral-600"
                />

                {/* Expanded Food Description Textarea - Fully Visible Without Scrollbar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                      <Ruler size={13} className="text-orange-400" /> Mô tả kích thước chi tiết ({foodSizeLevel})
                    </span>
                    <button
                      type="button"
                      onClick={handleSuggestFoodSize}
                      disabled={isSuggestingSize}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white text-[10px] font-extrabold py-1 px-3 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles size={12} className={isSuggestingSize ? "animate-spin" : ""} />
                      {isSuggestingSize ? "Đang gợi ý..." : `AI gợi ý (${foodSizeLevel})`}
                    </button>
                  </div>
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = `${Math.max(90, el.scrollHeight)}px`;
                      }
                    }}
                    placeholder={`Ví dụ: Có đúng 10 xúc tu bạch tuộc khổng lồ dài 80–100 cm, đường kính 18–20 cm... Giữ nguyên kích thước trong toàn bộ video.`}
                    value={foodSizeDetails}
                    onChange={(e) => setFoodSizeDetails(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-orange-500 transition-all text-xs font-normal leading-relaxed resize-none overflow-hidden placeholder-neutral-600"
                  />
                </div>
              </div>

              {/* Eating Style & Camera Style Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                    <Flame size={13} className="text-orange-400" /> Cách thưởng thức
                  </div>
                  <select 
                    value={eatingStyle} 
                    onChange={(e) => setEatingStyle(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 transition-all"
                  >
                    {eatingStyles.map(es => (
                      <option key={es.id} value={es.id}>{es.icon} {es.name}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                  <div className="flex items-center gap-2 mb-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                    <Camera size={13} className="text-orange-400" /> Kiểu góc máy quay
                  </div>
                  <select 
                    value={cameraStyle} 
                    onChange={(e) => setCameraStyle(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 text-white p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 transition-all"
                  >
                    {cameraStyles.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lựa chọn hành động nhân vật */}
              <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2 mb-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                  <Sparkles size={13} className="text-orange-400" /> Lựa chọn hành động nhân vật (Sản phẩm / Nước sốt)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {characterActionStyles.map((act) => {
                    const isSelected = characterActionStyle === act.id || characterActionStyle === act.name;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setCharacterActionStyle(act.id)}
                        className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-950/90 via-amber-950/80 to-orange-950/90 border-orange-500 text-white shadow-md shadow-orange-950/50'
                            : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-base mt-0.5">{act.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[11px] font-bold block leading-snug ${isSelected ? 'text-orange-300' : 'text-neutral-300'}`}>
                            {act.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Thời lượng & Tùy chọn mở rộng */}
          <div className="bg-neutral-950/80 backdrop-blur-xl p-5 rounded-3xl border border-orange-500/20 shadow-xl shadow-black/50 hover:border-orange-500/40 transition-all">
            <div className="flex items-center gap-2.5 mb-4 pb-2.5 border-b border-neutral-800/80">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-mono text-xs font-black border border-orange-500/30">03</span>
              <h3 className="text-sm font-black uppercase text-orange-300 tracking-wider">Cấu hình thời gian & Nâng cao</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thời lượng */}
              <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2 mb-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                  <Clock size={13} className="text-orange-400" /> Tổng thời gian (12s/Part)
                </div>
                <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-1.5">
                  <button onClick={() => handleDurationChange('minus')} className="p-2 text-neutral-400 hover:text-orange-400 transition-colors active:scale-90"><ChevronDown size={18}/></button>
                  <span className="font-black text-base text-amber-300 font-mono">{duration}s ({Math.ceil(duration/12)} Parts)</span>
                  <button onClick={() => handleDurationChange('plus')} className="p-2 text-neutral-400 hover:text-orange-400 transition-colors active:scale-90"><ChevronUp size={18}/></button>
                </div>
              </div>

              {/* Chế độ Prompt */}
              <div className="bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center gap-2 mb-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                  <Sparkles size={13} className="text-orange-400" /> Chế độ Kịch bản
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setGenerationMode('Detailed')} 
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                      generationMode === 'Detailed' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md border border-orange-400/40' 
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Kịch bản AI Video
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setGenerationMode('Fixed'); setIsCommerceMode(false); }} 
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all ${
                      generationMode === 'Fixed' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md border border-orange-400/40' 
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Ảnh đồ ăn
                  </button>
                </div>
              </div>

              {/* Commerce / Sponsorship */}
              {generationMode !== 'Fixed' && (
                <div className="md:col-span-2 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                      <ShoppingBag size={13} className="text-orange-400" /> Sản phẩm Bán Hàng / Tài Trợ (Đặt cạnh đồ ăn)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCommerceMode(!isCommerceMode)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                        isCommerceMode ? 'bg-orange-500' : 'bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          isCommerceMode ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {isCommerceMode && (
                    <div className="mt-3 animate-in fade-in duration-300 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">Tên sản phẩm bán hàng:</label>
                          <input
                            type="text"
                            placeholder="Nhập tên sản phẩm (VD: Chai tương ớt Chinsu, Gói gia vị X, Lon nước yến...)"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-orange-500 transition-all text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                            Ảnh sản phẩm (Tùy chọn - Dùng cho AI phân tích):
                          </label>
                          {productImage ? (
                            <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-orange-500/40">
                              <img
                                src={productImage}
                                alt="Product preview"
                                className="w-9 h-9 object-cover rounded-lg border border-orange-500/30"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-green-400 font-bold truncate">✓ Đã tải ảnh sản phẩm</p>
                                <p className="text-[9px] text-neutral-500">AI sẽ phân tích bao bì để gợi ý hành động</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProductImage(null)}
                                className="p-1 bg-red-950/60 hover:bg-red-900 text-red-400 hover:text-red-300 rounded-lg border border-red-800/40 transition-all"
                                title="Xóa ảnh sản phẩm"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center gap-2 py-2 px-3 bg-neutral-950 hover:bg-neutral-900 border border-dashed border-neutral-700 hover:border-orange-500 rounded-xl cursor-pointer transition-all text-xs text-neutral-400 hover:text-neutral-200">
                              <Camera size={14} className="text-orange-400" />
                              <span className="text-[11px] font-medium">Tải ảnh sản phẩm lên...</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setProductImage(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-neutral-300 flex items-center gap-1">
                            <span>Mô tả hành động sử dụng sản phẩm:</span>
                            <span className="text-[9px] font-normal text-amber-400">
                              (Nhân vật: {charNamesList.slice(0, numCharacters).join(', ')})
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={handleSuggestProductAction}
                            disabled={isSuggestingProductAction}
                            className="flex items-center gap-1 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white text-[10px] font-extrabold py-1 px-2.5 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Sparkles size={11} className={isSuggestingProductAction ? "animate-spin" : ""} />
                            {isSuggestingProductAction ? "Đang tạo gợi ý..." : "AI gợi ý hành động"}
                          </button>
                        </div>

                        <textarea
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${Math.max(80, el.scrollHeight)}px`;
                            }
                          }}
                          placeholder={`VD: ${charNamesList[0]} dùng tay phải cầm chắc chai nước chấm. Đưa chai lên phía trên đĩa. Nghiêng chai 45 độ. Nước chấm chảy dòng liên tục xuống đĩa. Sau đó dựng thẳng chai đặt lại cạnh đĩa...`}
                          value={productActionDescription}
                          onChange={(e) => setProductActionDescription(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-all text-xs font-normal leading-relaxed resize-none overflow-hidden placeholder-neutral-600"
                        />

                        <p className="text-[9px] text-amber-400/90 italic mt-1 leading-snug">
                          * Lưu ý: Mô tả hành động này CHỈ xuất hiện ở mốc 0s-3s (Part 1). Các mốc từ 3s-6s trở đi sẽ tập trung 100% vào việc nhân vật ăn uống liên tục. Nếu không nhập, sản phẩm mặc định sẽ luôn được đặt cố định bên cạnh đĩa thức ăn.
                        </p>

                        {/* Quick preset action buttons */}
                        <div className="mt-2.5 p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-800/80 space-y-1.5">
                          <span className="text-[9px] font-extrabold uppercase text-orange-400 tracking-wider block">Gợi ý mẫu hành động nhanh cho ({charNamesList.slice(0, numCharacters).join(', ')}):</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {[
                              { label: 'Rót chai nước chấm/tương ớt', text: `${charNamesList[0]} dùng tay phải cầm chắc chai nước chấm. Đưa chai lên phía trên chiếc đĩa. Nghiêng chai khoảng 45 độ. Nước chấm màu cam đỏ chảy chậm thành dòng liên tục xuống đĩa. Sau khi rót đủ lượng nước chấm, ${charNamesList[0]} dựng thẳng chai rồi đặt lại đúng vị trí bên cạnh đĩa.` },
                              { label: 'Xé gói gia vị/bao bì', text: `${charNamesList[0]} cầm gói gia vị bằng hai tay. Xé nhẹ ở góc trên. Đổ toàn bộ gia vị xuống món ăn. Gia vị rơi đều và phủ lên bề mặt thức ăn. Sau đó đặt vỏ gói sang bên cạnh.` },
                              { label: 'Mở lon nước/đồ uống', text: `${charNamesList[0]} cầm lon nước bằng tay phải. Đưa ngón cái vào khoen mở. Kéo khoen lên. Phát ra tiếng "tách" rõ ràng. Đưa lon lên miệng uống một ngụm. Hạ lon xuống bàn.` },
                              { label: 'Múc/Rưới hũ sốt', text: `${numCharacters >= 2 ? charNamesList[1] : charNamesList[0]} mở nắp hộp. Dùng thìa múc đầy sốt. Rưới chậm lên bạch tuộc. Sốt phủ đều bề mặt xúc tu.` }
                            ].map((ex, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setProductActionDescription(ex.text)}
                                className="text-left p-1.5 rounded-lg bg-neutral-900/90 hover:bg-orange-950/50 hover:border-orange-500/40 border border-neutral-800 text-neutral-300 transition-all font-sans leading-snug text-[10px]"
                              >
                                <strong className="text-orange-400 block text-[9px] uppercase font-black">{ex.label}</strong>
                                <span className="text-neutral-400 line-clamp-1">{ex.text}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lời thoại nhân vật */}
              <div className="md:col-span-2 bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-neutral-300 text-[11px] font-black uppercase tracking-wide">
                    <Coffee size={13} className="text-orange-400" fill="currentColor" /> Lời thoại nhân vật (Part 1 Cảnh đầu)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDialogueEnabled(!isDialogueEnabled)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      isDialogueEnabled ? 'bg-orange-500' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isDialogueEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {isDialogueEnabled && (
                  <div className="mt-2.5 animate-in fade-in duration-300 space-y-1.5">
                    <input
                      type="text"
                      placeholder='Nhập câu thoại NAM nói (VD: "Chào mọi người, hôm nay mình ăn mâm đồ ăn...")'
                      value={dialogueInput}
                      onChange={(e) => setDialogueInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-orange-500 transition-all text-xs font-semibold"
                    />
                    <p className="text-[9px] text-neutral-400 italic leading-relaxed">
                      * Nhân vật sẽ được yêu cầu nói bằng giọng nói tiếng gốc của cameo ở cảnh mở đầu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Action Summary & Output Generator Deck */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-5">
          <div className="bg-neutral-950/90 backdrop-blur-2xl p-5 rounded-3xl border border-orange-500/30 shadow-2xl shadow-orange-950/20 space-y-4">
            <h3 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-2 border-b border-neutral-800/80 pb-3">
              <Zap size={14} fill="currentColor" /> Bảng Tổng Quan Cấu Hình
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Số nhân vật:</span>
                <span className="font-bold text-white">{numCharacters} Người</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Thời trang:</span>
                <span className="font-bold text-orange-300">{outfitMode === 'Cameo' ? 'Cameo mặc định' : 'Tùy chỉnh riêng'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Bối cảnh:</span>
                <span className="font-bold text-white">{settingMode === 'Cameo' ? 'Cameo gốc' : 'Tùy chọn'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Món ăn:</span>
                <span className="font-black text-amber-300 truncate max-w-[150px]">{customFood || 'Chưa nhập'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Mức size:</span>
                <span className="font-extrabold text-orange-400 px-2 py-0.5 bg-orange-950/50 rounded-md border border-orange-500/30">{foodSizeLevel}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-900">
                <span className="text-neutral-400">Thời lượng:</span>
                <span className="font-bold text-white font-mono">{duration}s ({Math.ceil(duration/12)} Parts)</span>
              </div>
            </div>

            <button
              onClick={generatePrompts}
              disabled={isGenerating || !customFood.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-2xl font-black text-base shadow-xl shadow-orange-950/80 hover:shadow-orange-600/40 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 tracking-wide mt-2"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Đang khởi tạo AI...</span>
                </div>
              ) : (
                <>
                  <Zap size={20} fill="currentColor" /> 
                  <span>XUẤT CHUỖI PROMPT</span>
                </>
              )}
            </button>

            {generatedPrompts && (
              <button
                onClick={downloadAllPrompts}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded-xl border border-orange-500/30 shadow-lg transition-all font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <Download size={15} className="text-orange-400" /> TẢI XUỐNG (.txt)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Prompts Result Workspace */}
      {generatedPrompts && (
        <div className="w-full max-w-6xl mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-orange-500/30">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
              <h2 className="text-lg font-black uppercase text-orange-300 tracking-wider">
                Kết quả Chuỗi Prompt Mukbang ({generatedPrompts.length} Parts)
              </h2>
            </div>
            <button
              onClick={downloadAllPrompts}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl shadow-lg transition-all text-xs font-bold active:scale-95"
            >
              <Download size={15} /> TẢI XUỐNG TẤT CẢ FILE (.txt)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {generatedPrompts.map((prompt, pIdx) => (
              <div key={prompt.id} className="bg-neutral-950/80 backdrop-blur-xl p-5 rounded-3xl border border-orange-500/20 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3.5 py-1 bg-orange-950/50 border border-orange-500/40 rounded-full text-xs font-black text-orange-400">
                    {pIdx % 3 === 0 ? 'PART 1: BẮT ĐẦU ĂN' : pIdx % 3 === 1 ? 'PART 2: ĐANG ĂN NGON' : 'PART 3: THƯỞNG THỨC & UỐNG'}
                  </div>
                  <div className="text-xs font-black text-amber-300/90 uppercase tracking-widest font-mono">
                    Video Part {prompt.index}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { lang: 'vi', label: 'TIẾNG VIỆT (EDIT ĐỢI ĐỒNG BỘ)', content: prompt.vi, color: 'border-orange-500/30 bg-neutral-900/90' },
                    { lang: 'en', label: 'ENGLISH (PROMPT AI GỐC)', content: prompt.en, color: 'border-amber-500/20 bg-neutral-900/60' },
                    { lang: 'zh', label: 'CHINESE (DỊCH TỰ ĐỘNG)', content: prompt.zh, color: 'border-amber-500/20 bg-neutral-900/60' }
                  ].map((item) => {
                    const uniqueKey = `${prompt.id}-${item.lang}`;
                    return (
                      <div key={item.lang} className={`rounded-2xl border ${item.color} overflow-hidden shadow-lg`}>
                        <div className="bg-neutral-950/90 border-b border-neutral-800/80 px-4 py-2.5 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-wider text-orange-400">{item.label}</span>
                            {item.lang === 'vi' && (
                              <button 
                                onClick={() => handleSyncPrompt(prompt.id)}
                                disabled={syncingPromptId === prompt.id}
                                className="flex items-center gap-1 px-2.5 py-0.5 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-extrabold rounded-md transition-all active:scale-95 disabled:opacity-50"
                              >
                                {syncingPromptId === prompt.id ? <div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full"></div> : <RefreshCw size={10} />}
                                ĐỒNG BỘ
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(item.content, uniqueKey)}
                            className={`flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-1 rounded-md transition-all ${
                              copiedKey === uniqueKey ? 'text-green-400 bg-green-950/50 border border-green-500/30' : 'text-neutral-400 hover:text-white bg-neutral-900'
                            }`}
                          >
                            {copiedKey === uniqueKey ? <Check size={11} /> : <Copy size={11} />} {copiedKey === uniqueKey ? 'ĐÃ COPIED' : 'COPY'}
                          </button>
                        </div>
                        <div className="p-4">
                          {item.lang === 'vi' ? (
                            <textarea
                              ref={(el) => {
                                if (el) {
                                  el.style.height = 'auto';
                                  el.style.height = `${el.scrollHeight}px`;
                                }
                              }}
                              value={item.content}
                              onChange={(e) => {
                                setGeneratedPrompts(prev => prev?.map(p => 
                                  p.id === prompt.id ? { ...p, vi: e.target.value } : p
                                ) || null);
                              }}
                              className="w-full bg-transparent text-xs leading-relaxed text-neutral-100 whitespace-pre-wrap font-sans border-none focus:ring-0 resize-none overflow-hidden outline-none"
                            />
                          ) : (
                            <pre className="text-xs leading-relaxed text-neutral-300 whitespace-pre-wrap font-sans">
                              {item.content}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-orange-500/30 p-3.5 text-center shadow-[0_-10px_30px_rgba(249,115,22,0.1)]">
        <p className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
          Hỗ trợ liên hệ <span className="text-orange-400 font-extrabold ml-1">Nam 0981028794</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
