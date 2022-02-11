import { defSystem } from "@thi.ng/system";

interface App {
    config: AppConfig;
    //args: ArgParser;
}

async function main() {
    // main app
    const APP = defSystem<App>({
        config: {
            factory: () => new AppConfig(),
        }
    });
    try {
        await APP.start();
    } catch (e) {
        //APP.components.logger.severe((<Error>e).message);
        console.log(e);
    }
}
main();
