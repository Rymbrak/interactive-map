/**
 * Class for handling different map versions.
 * Intended to provide update paths for earlier versions in case of breaking changes.
 */
export class VersionManager implements IVersionManager {
    version: string = "0.5.0";

    /**
     * Applies patches to a map file if necessary.
     * @param json 
     * @returns 
     */
    convert(json: string) {

        let fileVersion = this.getVersion(json);
        let result = { json: json, version: fileVersion };
        
        result = this.update021(result);

        return result.json;
    }

    update021({ json, version }: { json: string; version: string; }) {

        
        if (version === "0.2.0") {
            
            json = json.replaceAll('"name": "circleMarker"', '"name": "circlemarker"');
        }

        return {json, version};
    }

    /**
     * Returns the version of the given map file as string.
     * @param json Read map file as string.
     * @returns  Version string.
     */
    getVersion(json: string) {

        let properties = json.split(',');
        for (const element of properties) {
            if (element.includes('"version": ')) {

                let v = element.replace('"version": "', "");
                v = v.replaceAll('"', "");
                v = v.trim();

                return v;
            }
        };
        return "0.0.0";
    }

}