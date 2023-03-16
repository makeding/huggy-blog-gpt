import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { FC } from "react";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[60px] border-b border-gray-300 py-2 px-8 items-center justify-between">
      <div className="font-bold text-2xl flex items-center">
        <Link
          className="hover:opacity-50"
          href="/"
        >
          huggy blog GPT
        </Link>
      </div>
      <div>
        <a
          className="flex items-center hover:opacity-50"
          href="https://blog.huggy.moe/posts/"
          target="_blank"
          rel="noreferrer"
        >
          <div className="hidden sm:flex">blog.huggy.moe</div>

          <IconExternalLink
            className="ml-1"
            size={20}
          />
        </a>
      </div>
    </div>
  );
};
