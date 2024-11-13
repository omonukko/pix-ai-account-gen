# pix-ai-account-gen
前作ったpix-chanのアカウント生成が遅いので垢生成に特化したやつを作りました

前提パッケージのインストールコマンド

```
npm install axios ts-node
```
buildは自分でしてください


# 使い方:

```typescript
import {PixGEN} from

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let pix:PixGEN;

async function createPixAIAccount() {
  try {
      const mail = "適当なmail"
      const pass = "適当なpassword"
      sleep(500)
      
      pix = new PixGEN();
      const gen = await pix.register(mail,pass);
      
      await sleep(2000);

      console.log(`Email: ${mail}`);
      console.log(`Password: ${pass}`);
      console.log(`Token:${JSON.stringify(await pix.viewToken())}`)     

      await sleep(1000)

      await pix.claimDailyQuota();
      await pix.claimQuestionnaireQuota();
      if (gen.status === true && gen.infos && 'token' in gen.infos) {
      console.log(gen.infos)
    }else if (gen.status === false && gen.infos.error && 'error' in gen.infos) {
      logger.error(gen.infos.error)
    }
    
  } catch (error) {
      console.error(error);
  }
};

```
