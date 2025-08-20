import { MarketSlug } from "@/types/market";


type Props ={
    market: MarketSlug
}
export default function MarketSmall(props:Props) {
  return (
    <div className="bg-[#0A0B0D] p-4 rounded-lg border border-[#1E2329]">
        <p>hello</p>
      <h2 className="text-lg font-semibold ">{props.market.id}</h2>
      <p className="text-[#94A3B8]">{props.market.description}</p>
    </div>
  );
}