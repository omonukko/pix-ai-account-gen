import axios from "axios";
import { C, Reset } from "./logcolor";
import * as fs from 'fs';
import path from "path";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const instance = axios.create({});

export class PixError extends Error {};
type GenResultSuccess = {
    status: true;
    infos: {
        email?: string;
        password?: string;
        token?: string;
        userid?: string;
        createdAt?:string;
        emailVerified?:boolean;
        username?:string;
    };
};

type GenResultFailure = {
    status: false;
    infos: {
        error: string;
    };
};

class PixLogger {
    public info(...message: any[]) {
        const now = new Date();

        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const timeString = `${hours}:${minutes}:${seconds}`;
        console.log(`[${timeString}]`, `${C.Cyan}[Pix Logger INFO]${Reset}`, "Message -> [", ...message, "]");
    }

    public log(firstcolor: string, title: any, ...message: any[]) {
        const now = new Date();

        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const timeString = `${hours}:${minutes}:${seconds}`;
        console.log(`[${timeString}]`, `${firstcolor}[${title}]${Reset}`, "Message -> [", ...message, "]");
    }

    public error(...error: any[]) {
        const now = new Date();

        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const timeString = `${hours}:${minutes}:${seconds}`;
        const err = new Error(...error).stack!;
        console.error(`[${timeString}]`, `${C.Red}[Pix Logger ERROR]${Reset}`, C.Red, "Error -> [", err, "]");
    }
}


type genResult = GenResultSuccess | GenResultFailure;

export class PixGEN {
    private headers: Record<string, string>;
    private user_id?: string;
    private token!:string;
    private Logger!:PixLogger;
    
    constructor() {
        this.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "Origin": "https://pixai.art",
            "Priority": "u=1, i",
            "Referer": "https://pixai.art/",
            "Sec-Ch-Ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": "\"Windows\"",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        };
        this.Logger = new PixLogger
    }

    private async captcha() {
        const response = instance.get("https://www.google.com/recaptcha/api2/anchor?ar=1&k=6Ld_hskiAAAAADfg9HredZvZx8Z_C8FrNJ519Rc6&co=aHR0cHM6Ly9waXhhaS5hcnQ6NDQz&hl=ja&v=aR-zv8WjtWx4lAw-tRCA-zca&size=invisible&cb=u2wj0bvs99s6");
            
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const responseText = (await response).data as string;
        const recaptchaToken = responseText.split('recaptcha-token" value="')[1]?.split('">')[0];
        this.Logger.info(`Recaptcha Solving...`);
        
        const payload = new URLSearchParams({
            v: "aR-zv8WjtWx4lAw-tRCA-zca",
            reason: "q",
            c: recaptchaToken!,
            k: "6Ld_hskiAAAAADfg9HredZvZx8Z_C8FrNJ519Rc6",
            co: "aHR0cHM6Ly9waXhhaS5hcnQ6NDQz",
            hl: "ja",
            size: "invisible",
        });
                
        const postResponse = await instance.post("https://www.google.com/recaptcha/api2/reload?k=6Ld_hskiAAAAADfg9HredZvZx8Z_C8FrNJ519Rc6", 
            payload.toString(),
            {
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const postText = postResponse.data as string;
        const token = postText.split('"rresp","')[1]?.split('"')[0];
        this.Logger.info(`Solved Recaptcha`);
        
        return token;
    } catch (error:any) {
        throw new Error("Error while extracting token: " + error);

    }

    public async register(email: string, password: string): Promise<genResult> {
        const recaptchaToken = await this.captcha();
        if (!recaptchaToken) {
            throw new PixError("Captcha Failed");
        }

        const query = `mutation register($input: RegisterOrLoginInput!) { 
            register(input: $input) { 
                ...UserBase 
            } 
        }
        
        fragment UserBase on User { 
            id 
            email 
            emailVerified 
            username 
            displayName 
            createdAt 
            updatedAt 
            avatarMedia { 
                ...MediaBase 
            } 
            membership { 
                membershipId 
                tier 
            } 
            isAdmin 
        } 
        
        fragment MediaBase on Media { 
            id 
            type 
            width 
            height 
            urls { 
                variant 
                url 
            } 
            imageType 
            fileUrl 
            duration 
            thumbnailUrl 
            hlsUrl 
            size 
            flag { 
                ...ModerationFlagBase 
            } 
        } 
        
        fragment ModerationFlagBase on ModerationFlag { 
            status 
            isSensitive 
            isMinors 
            isRealistic 
            isFlagged 
            isSexyPic 
            isSexyText 
            shouldBlur 
            isWarned 
        }`;

        const payload = {
            query,
            variables: {
                input: {
                    email,
                    password,
                    recaptchaToken
                }
            }
        };

        const response = await fetch("https://api.pixai.art/graphql", {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        
        if (responseData.errors) {
            return {
                status: false,
                infos: {
                    error: `${JSON.stringify(responseData.errors)}`
                }
            };        
        }

        const token = response.headers.get('Token');
        this.user_id = responseData.data.register.id;
        await this.setPreferences();
        this.headers["authorization"] = `Bearer ${token}`;
        this.token = `Bearer ${token}`
        writeToFile(path.join(__dirname,"./accounts.json"),email,password,responseData.data.register.createdAt,"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",recaptchaToken,this.token)
        return {
            status:true,
            infos:{
                email:email,
                password:password,
                token:token!,
                userid:this.user_id,
                createdAt:responseData.data.register.createdAt,
                emailVerified:responseData.data.register.emailVerified,
                username:responseData.data.register.username
            }
        }
    }

    private async setPreferences(): Promise<void> {
        const agePayload = {
            query: `mutation setPreferences($value: JSONObject!) { setPreferences(value: $value) }`,
            variables: {
                value: {
                    experienceLevel: "beginner",
                    ageVerificationStatus: "OVER18"
                }
            }
        };

        await fetch("https://api.pixai.art/graphql", {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(agePayload),
        });
    }
    public async claimDailyQuota(): Promise<any> {
        const payload = { query: `mutation dailyClaimQuota { dailyClaimQuota }` };
        const response = await axios.post("https://api.pixai.art/graphql", payload, { headers: this.headers});
        if ("errors" in response.data) {
            throw new PixError(JSON.stringify(response.data.errors));
        }
        return response.data;
    }

    public async viewToken():Promise<string> {
        return `${this.token}`;
    }

    public async claimQuestionnaireQuota(wait: number = 3): Promise<any> {
        const formData = new URLSearchParams({
            'entry.64278853': `${this.user_id}`,
            'entry.2090837715': '趣味に身を投じる人', 
            'entry.238512000': '18-25', 
            'entry.1451582794': '日本', 
            'entry.571931610': 'AI生成ツールをほとんど使ったことがない', 
            'entry.1078511207': 'Twitter', 
            'entry.1446121912': '好きなキャラクター', 
            'entry.2087342135': 'カートゥーン', 
            'entry.1264482712': '壁紙・プロフィール画像用', 
            'entry.1293236062': '7', 
        });

        try {
            await axios.post(
                "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdYvAY6PDOVBl3Bd2FgnkCoz-G0KXk8OV_63gG96FIVYm0mEw/formResponse",
                formData,
                { headers:{'Content-Type': 'application/x-www-form-urlencoded'} }
            );
        } catch (error) {
            throw new PixError("Google Forms submission failed: " + error);
        }

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const payload = {
            query: `mutation claimQuestReward($id: ID!) { rewardQuest(id: $id) { count } }`,
            variables: { id: "1723830082652557313" }
        };

        if (wait > 0) {
            await sleep(wait * 1000);
        }
        try {
            const response = await axios.post("https://api.pixai.art/graphql", payload, { headers: this.headers });
            if (response.data.errors) {
                throw new PixError(JSON.stringify(response.data.errors));
            }
            return response.data;
        } catch (error) {
            throw new PixError("API request failed: " + error);
        }
    }
    
}


function writeToFile(filePath: string, email: string, password: string, timestamp: string, user_agent: string, recaptchaToken: string, token: string) {
    let data;

    try {
        if (fs.existsSync(filePath)) {
            const existingData = fs.readFileSync(filePath, 'utf8');
            data = JSON.parse(existingData);
        } else {
            data = { accounts: [] };
        }
    } catch (error) {
        console.error("Error reading file:", error);
        data = { accounts: [] };
    }

    data.accounts.push({
        email: email,
        timestamp: timestamp,
        password: password,
        recaptchatoken: recaptchaToken,
        token: token,
        user_agent: user_agent,
    });

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (error) {
        console.error("Error writing to file:", error);
    }
}
