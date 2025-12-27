import { View, ZCascader } from "@blog/components";
import addressOptions from "@blog/components/design/z-address/address-options.json";

export default function ToolboxHomePage() {
  // const [value, setValue] = React.useState("");

  return (
    <View className="h-full p-4 space-y-6">
      <ZCascader options={addressOptions} />
    </View>
  );
}
