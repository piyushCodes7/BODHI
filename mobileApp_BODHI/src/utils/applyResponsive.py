import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # If already responsive, maybe skip or handle gracefully
    # We will look for style sheets and replace fontSize: XX
    
    # Check if we need to add import
    if "import { isTablet, isLandscape, responsiveFont, responsiveWidth, responsiveHeight }" not in content and "responsiveFont(" not in content:
        # insert after the last react-native import or react import
        import_stmt = "import { isTablet, isLandscape, responsiveFont, responsiveWidth, responsiveHeight } from '../utils/responsive';\n"
        
        # Simple heuristic: find 'react-native'
        idx = content.find("from 'react-native';")
        if idx != -1:
            end_of_line = content.find('\n', idx)
            content = content[:end_of_line+1] + import_stmt + content[end_of_line+1:]
        else:
            # Maybe it's double quotes
            idx = content.find('from "react-native";')
            if idx != -1:
                end_of_line = content.find('\n', idx)
                content = content[:end_of_line+1] + import_stmt + content[end_of_line+1:]

    # Replace font sizes
    # Be careful not to replace if already responsiveFont
    content = re.sub(r'fontSize:\s*(\d+)', r'fontSize: responsiveFont(\1)', content)
    
    # Let's not automatically replace all width/height/padding as it might break some absolute positioned circles
    # But we can replace specific ones if requested.
    
    with open(filepath, 'w') as f:
        f.write(content)

screens_dir = "/Users/govindjindal/BODHI/mobileApp_BODHI/src/screens"
for filename in os.listdir(screens_dir):
    if filename.endswith(".tsx"):
        process_file(os.path.join(screens_dir, filename))

components_dir = "/Users/govindjindal/BODHI/mobileApp_BODHI/src/components"
for filename in os.listdir(components_dir):
    if filename.endswith(".tsx"):
        process_file(os.path.join(components_dir, filename))

print("Applied responsiveFont to screens and components")
