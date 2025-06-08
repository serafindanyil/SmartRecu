interface ShowBarBaseProps {
	title: string;
	description?: string | React.ReactNode;
	children: React.ReactNode;
}

const ShowBarBase = ({ title, description, children }: ShowBarBaseProps) => {
	return (
		<article className="bg-white-100 p-6 rounded-[30px] shadow-shapes w-full">
			<div
				className={`flex flex-row items-center mb-3 ${
					description ? "justify-between" : "justify-left"
				} gap-4`}>
				<h3 className="font-semibold text-black-400 text-xl truncate">
					{title}
				</h3>
				{description && typeof description === "string" ? (
					<p className="font-medium text-gray-400 text-md">{description}</p>
				) : (
					description
				)}
			</div>
			{children}
		</article>
	);
};

export default ShowBarBase;
