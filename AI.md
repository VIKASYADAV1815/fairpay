# Fairpay × AI — where it fits

> Yes, you can add AI. It should **assist the split/settle loop**, not become a chatbot that distracts from money clarity.  
> Status: **planned** · no model wired yet · UI hooks can land as Pro features.

---

## Principle

Fairpay’s wedge is **WhatsApp settle + group pot**.  
AI earns its keep only when it:

1. Saves taps (receipt → expense)  
2. Reduces settle friction (better messages / who-owes)  
3. Protects fairness (odd splits, missing people)  
4. Feeds the **group pot** story (deal match, cashback explain)

If a feature doesn’t touch those, skip it.

---

## Where AI works (by surface)

| Surface | AI job | User sees | Monetize |
|---------|--------|-----------|----------|
| **Add expense** | Receipt OCR + line items | “Scan bill → autofill title, amount, tip” | Pro |
| **Add expense** | Smart split suggest | “Looks like dinner for 4 — equal?” / exclude host tip | Free lite / Pro full |
| **Settle** | Message polish | Rewrite WhatsApp nudge: polite, short, pay-link intact | Free |
| **Settle** | Rail pick | “Alex has UPI + PayPal — open UPI for INR group” | Free |
| **Home / trip** | Gentle coach | “2 unpaid · notify Mira?” one-tap | Pro batch |
| **Deals** | Match to trip | “Manali weekend → stay deals near your dates” | Affiliate + Pro track |
| **People** | Handle cleanup | Normalize UPI / PayPal.me from pasted text | Free |
| **History** | Summary | “March flat: ₹24k · you net −₹1.2k” | Pro PDF + AI blurb |

---

## Recommended build order

### Phase AI-0 — product copy only (now)
- Document surfaces (this file)  
- Empty states mention “AI receipt scan — Pro · soon”  
- No API keys in the app yet  

### Phase AI-1 — Receipt → expense (highest ROI)
- Camera / gallery → image  
- Vision model (GPT-4o / Claude / Gemini) → `{ title, amount, currency, tip?, merchants? }`  
- User confirms before save  
- **Pro-gated**; Free = manual entry  

### Phase AI-2 — Settle assist
- Template + LLM rewrite of WhatsApp body (keep pay link untouched)  
- Optional tone: Friendly / Firm / Funny  
- Runs on-device copy first; cloud only if user opts in  

### Phase AI-3 — Split intelligence
- From members + receipt lines, propose unequal splits  
- Flag “you’re covering 90% again” soft nudge  

### Phase AI-4 — Deals / pot
- Embed trip purpose + dates → ranked affiliate cards  
- Explain cashback in one line for the pot  

---

## Architecture (when you wire it)

```
App (Expo)
  └─ src/lib/ai/
       ├─ client.ts      // provider switch, keys via EAS secrets
       ├─ receipt.ts     // image → structured expense
       ├─ settleCopy.ts  // balances + rail → WhatsApp text
       └─ splitSuggest.ts
  └─ UI
       AddExpenseSheet → “Scan with AI”
       Settle screen   → “Polish message”
       Pro screen      → AI features listed
```

**Rules**
- Never send full group history without consent  
- Strip phone numbers from prompts when possible  
- Show “AI draft — edit before send” always  
- Fail open: if AI errors, fall back to current manual flow  

---

## What AI is *not* for Fairpay

- Holding money / deciding payments  
- Replacing WhatsApp  
- Auto-marking paid without a human tap  
- Creepy “we saw your chats” claims  

---

## Score impact

Clear AI roadmap + one shipped AI-1 (receipt) is what moves **earn/product** from “demo Pro” toward **>8/10** with a real differentiator: *settle in chat + AI that does the boring entry work*.
