const fs = require('fs');

// Specialized custom recipes for dishes with missing data
const CUSTOM_RECIPES = {
  'recipe-banh-dua-nuong-5de8961a': {
    ingredients: [
      { name: 'Dừa nạo', quantity: 1000, unit: 'g' },
      { name: 'Lòng trắng trứng', quantity: 160, unit: 'g' },
      { name: 'Bột mì', quantity: 100, unit: 'g' },
      { name: 'Đường xay', quantity: 100, unit: 'g' }
    ],
    steps: [
      { instruction: 'Đánh đều hỗn hợp lòng trắng trứng và đường xay cho đến khi bông mịn.' },
      { instruction: 'Cho bột mì và dừa nạo vào tô trứng đường, trộn đều các nguyên liệu cho hòa quyện.' },
      { instruction: 'Rải phần nguyên liệu đã trộn đều vào khay nướng, sấy ở nhiệt độ 90 - 100°C trong vòng 30 phút cho ráo dẻo để dễ tạo hình.' },
      { instruction: 'Lấy ra vo thành từng viên tròn nhỏ vừa ăn, xếp đều lên khay nướng có lót giấy nến.' },
      { instruction: 'Nướng ở 100°C đến khi bánh đạt màu vàng giòn ưng ý. Để nguội hoàn toàn rồi bảo quản trong hũ kín.' }
    ]
  },
  'recipe-bo-kho-d79a8a64': {
    ingredients: [
      { name: 'Bắp bò (hoặc thăn bò)', quantity: 350, unit: 'g' },
      { name: 'Cà rốt', quantity: 2, unit: 'củ' },
      { name: 'Nước dừa tươi', quantity: 500, unit: 'ml' },
      { name: 'Sả cây', quantity: 3, unit: 'nhánh' },
      { name: 'Hành tím, tỏi, gừng băm', quantity: 30, unit: 'g' },
      { name: 'Cà chua', quantity: 1, unit: 'quả' },
      { name: 'Bột nghệ', quantity: 0.5, unit: 'muỗng cà phê' },
      { name: 'Ngũ vị hương', quantity: 0.5, unit: 'muỗng cà phê' },
      { name: 'Bột ớt không cay', quantity: 0.5, unit: 'muỗng cà phê' },
      { name: 'Dầu màu điều', quantity: 1, unit: 'muỗng canh' },
      { name: 'Hoa hồi, thanh quế', quantity: 2, unit: 'cái' },
      { name: 'Bột năng', quantity: 1, unit: 'muỗng canh' },
      { name: 'Húng quế', quantity: 1, unit: 'ít' }
    ],
    steps: [
      { instruction: 'Thịt bò cắt khối vuông vừa ăn. Ướp thịt cùng bột nghệ, ngũ vị hương, bột ớt, tiêu xay và dầu màu điều trong ít nhất 30 phút (tốt nhất là qua đêm trong ngăn mát).' },
      { instruction: 'Làm nóng chảo với chút dầu màu điều, phi thơm sả đập dập, hành tỏi băm và gừng cắt lát. Cho cà chua băm nhỏ vào xào nhuyễn tạo màu.' },
      { instruction: 'Cho thịt bò đã ướp vào xào ở lửa lớn đến khi săn lại. Đổ nước dừa tươi vào ngập mặt thịt, đun sôi rồi vớt sạch bọt.' },
      { instruction: 'Thêm hoa hồi và quế vào nồi. Đổ chút bột năng đã hòa tan vào khuấy nhẹ tạo độ sánh sệt. Hạ nhỏ lửa đậy nắp ninh đến khi thịt bò mềm.' },
      { instruction: 'Cho cà rốt cắt khúc vào đun tiếp khoảng 10 phút cho cà rốt chín mềm, nêm lại gia vị vừa ăn rồi tắt bếp. Rắc thêm rau húng quế và thưởng thức cùng bánh mì hoặc hủ tiếu.' }
    ]
  },
  'recipe-canh-cua-mong-toi-muop-d92efe6e': {
    ingredients: [
      { name: 'Cua đồng', quantity: 1000, unit: 'g' },
      { name: 'Rau mồng tơi', quantity: 200, unit: 'g' },
      { name: 'Mướp hương', quantity: 1, unit: 'trái' },
      { name: 'Hành tím băm', quantity: 2, unit: 'củ' },
      { name: 'Gia vị: Muối, nước mắm, hạt nêm', quantity: 1, unit: 'ít' }
    ],
    video_url: 'https://www.youtube.com/watch?v=9TuzTIWAtTI',
    steps: [
      { instruction: 'Cua đồng rửa sạch, tách mai khều lấy gạch. Phần thân cua đem giã hoặc xay nhuyễn cùng chút muối rồi lọc lấy nước cua.' },
      { instruction: 'Rau mồng tơi nhặt lá non, rửa sạch và thái khúc. Mướp gọt vỏ, rửa sạch và cắt lát xéo vừa ăn.' },
      { instruction: 'Bắc nồi nước cua lên bếp đun ở lửa vừa, khuấy nhẹ đều tay theo một chiều cho đến khi thịt cua bắt đầu nổi lên thành mảng thì hạ nhỏ lửa để riêu không bị vỡ.' },
      { instruction: 'Gạt nhẹ phần riêu cua sang một bên, cho mướp và rau mồng tơi vào nồi. Nấu cho rau mướp vừa chín tới thì nêm nước mắm và hạt nêm cho vừa khẩu vị.' },
      { instruction: 'Phi thơm hành tím với gạch cua rồi trút vào nồi canh cho dậy mùi thơm và màu vàng óng, tắt bếp múc ra tô thưởng thức.' }
    ]
  },
  'recipe-salad-uc-ga-cai-kale-883f8d63': {
    ingredients: [
      { name: 'Ức gà', quantity: 200, unit: 'g' },
      { name: 'Cải kale', quantity: 100, unit: 'g' },
      { name: 'Cà rốt', quantity: 1, unit: 'củ' },
      { name: 'Trứng cút', quantity: 5, unit: 'quả' },
      { name: 'Quả bơ', quantity: 1, unit: 'quả' },
      { name: 'Gia vị sốt: Giấm táo, mật ong, tiêu đen, bột ớt, muối hồng', quantity: 1, unit: 'phần' }
    ],
    steps: [
      { instruction: 'Ức gà làm sạch, ướp tiêu đen và bột ớt. Áp chảo chín vàng đều hai mặt rồi thái lát vừa ăn.' },
      { instruction: 'Trứng cút luộc chín, bóc vỏ và cắt đôi. Quả bơ gọt vỏ cắt lát. Cà rốt bào sợi. Cải kale rửa sạch để ráo, cắt khúc vừa ăn bóp nhẹ.' },
      { instruction: 'Pha nước sốt: Trộn đều giấm táo, mật ong, tiêu đen, bột ớt và một nhúm muối hồng.' },
      { instruction: 'Xếp cải kale, cà rốt và bơ ra đĩa. Đặt ức gà áp chảo và trứng cút lên trên. Rưới nước sốt đều lên và thưởng thức.' }
    ]
  },
  'recipe-pho-tron-uc-ga-72930f73': {
    ingredients: [
      { name: 'Bánh phở tươi (hoặc phở gạo lứt)', quantity: 200, unit: 'g' },
      { name: 'Ức gà', quantity: 150, unit: 'g' },
      { name: 'Cà rốt', quantity: 1, unit: 'củ' },
      { name: 'Bắp cải tím / trắng', quantity: 50, unit: 'g' },
      { name: 'Xà lách, rau thơm', quantity: 50, unit: 'g' },
      { name: 'Trứng cút', quantity: 4, unit: 'quả' },
      { name: 'Nước sốt trộn: Nước mắm, nước tương, tỏi, ớt, đường phèn, tiêu đen', quantity: 1, unit: 'phần' }
    ],
    steps: [
      { instruction: 'Ức gà ướp tiêu đen và bột ớt, áp chảo chín đều 2 mặt rồi xé sợi nhỏ.' },
      { instruction: 'Bánh phở luộc chín tới, vớt ra xả nước đá lạnh rồi để ráo để sợi phở tơi dai.' },
      { instruction: 'Trứng cút luộc chín bóc vỏ. Cà rốt và bắp cải bào sợi mỏng. Rau thơm, xà lách rửa sạch cắt nhỏ.' },
      { instruction: 'Pha sốt trộn: Khuấy đều nước tương, nước mắm, đường phèn, tỏi ớt băm nhuyễn và tiêu đen.' },
      { instruction: 'Cho bánh phở vào tô cùng rau củ, ức gà xé và trứng cút. Rưới sốt trộn đều tay và thưởng thức.' }
    ]
  },
  'recipe-com-uc-ga-sot-cay-104fba0d': {
    ingredients: [
      { name: 'Cơm gạo lứt (hoặc cơm nấu đậu đen)', quantity: 1, unit: 'bát' },
      { name: 'Ức gà', quantity: 150, unit: 'g' },
      { name: 'Ngô bao tử', quantity: 50, unit: 'g' },
      { name: 'Gia vị sốt cay: Nước mắm, nước cốt tắc, mật ong, tiêu đen, bột ớt Hàn Quốc', quantity: 1, unit: 'phần' }
    ],
    steps: [
      { instruction: 'Ức gà rửa sạch, khía nhẹ bề mặt, ướp với tiêu đen và bột ớt Hàn Quốc trong 15 phút.' },
      { instruction: 'Cho chút dầu vào chảo, áp chảo ức gà vàng thơm 2 mặt đến khi chín tới. Cắt miếng vừa ăn.' },
      { instruction: 'Ngô bao tử rửa sạch, chẻ đôi, áp chảo nhanh cho chín giòn ngọt.' },
      { instruction: 'Pha nước sốt: Trộn đều nước mắm, nước cốt tắc, mật ong, tiêu đen và bột ớt.' },
      { instruction: 'Xới cơm ra đĩa, xếp ức gà và ngô bao tử lên trên, rưới sốt cay đậm đà và thưởng thức nóng.' }
    ]
  },
  'recipe-com-ca-ri-uc-ga-d5057cf4': {
    ingredients: [
      { name: 'Ức gà', quantity: 200, unit: 'g' },
      { name: 'Hành tây', quantity: 1, unit: 'củ' },
      { name: 'Khoai tây', quantity: 1, unit: 'củ' },
      { name: 'Cà rốt', quantity: 1, unit: 'củ' },
      { name: 'Bột cà ri', quantity: 1, unit: 'gói' },
      { name: 'Nước lọc', quantity: 700, unit: 'ml' },
      { name: 'Bột năng', quantity: 1, unit: 'muỗng canh' },
      { name: 'Gia vị: Hạt nêm, nước mắm', quantity: 1, unit: 'ít' },
      { name: 'Cơm trắng', quantity: 2, unit: 'bát' }
    ],
    steps: [
      { instruction: 'Ức gà, khoai tây, cà rốt và hành tây cắt khối vuông vừa ăn.' },
      { instruction: 'Phi thơm hành tây với ức gà, sau đó cho khoai tây và cà rốt vào xào săn.' },
      { instruction: 'Đổ 700ml nước vào nồi cùng bột cà ri, hạt nêm, nước mắm. Đậy nắp đun nhỏ lửa khoảng 20 - 25 phút cho các nguyên liệu chín mềm.' },
      { instruction: 'Hòa tan bột năng với chút nước rồi đổ từ từ vào nồi cà ri, khuấy đều đợi sốt sánh lại trong 5 - 10 phút.' },
      { instruction: 'Múc cà ri gà ra đĩa ăn kèm với cơm nóng dẻo.' }
    ]
  },
  'recipe-chao-yen-mach-ga-ngo-nam-52bf0292': {
    ingredients: [
      { name: 'Yến mạch cán dẹt', quantity: 50, unit: 'g' },
      { name: 'Ức gà xé sợi', quantity: 60, unit: 'g' },
      { name: 'Cà rốt băm', quantity: 30, unit: 'g' },
      { name: 'Ngô ngọt', quantity: 30, unit: 'g' },
      { name: 'Nấm ngọc châm (hoặc nấm hương)', quantity: 30, unit: 'g' },
      { name: 'Gia vị: Dầu hào, nước mắm, hạt nêm', quantity: 1, unit: 'ít' }
    ],
    steps: [
      { instruction: 'Xào hỗn hợp ức gà xé sợi, cà rốt băm, ngô ngọt và nấm ngọc châm với chút dầu hào, nước mắm cho thơm chín.' },
      { instruction: 'Đun sôi khoảng 350ml nước, cho yến mạch vào khuấy đều ở lửa nhỏ cho yến mạch nở bung mềm.' },
      { instruction: 'Trút phần hỗn hợp gà ngô nấm đã xào vào nồi cháo, nêm xíu hạt nêm cho vừa miệng, đun sôi lại rồi tắt bếp múc ra tô thưởng thức.' }
    ]
  },
  'recipe-my-van-than-cach-lam-hoanh-thanh-sui-cao-32f9e0bd': {
    notes: 'Bí quyết để nước dùng mỳ vằn thắn trong và ngọt thanh: Ninh xương gà và xương ống ở lửa nhỏ, hớt bọt liên tục. Thêm tôm khô, mực nướng và củ cải trắng để tạo vị ngọt sâu tự nhiên.',
    description: 'Công thức nấu mỳ vằn thắn trứ danh chuẩn vị gồm 4 phần: làm thịt xá xíu thơm lừng, gói hoành thánh nhân tôm thịt tươi giòn, ninh nước dùng thanh ngọt và hoàn thiện tô mỳ tròn vị.',
    steps: [
      { instruction: 'Làm thịt xá xíu: Thịt ba chỉ rửa sạch thấm khô. Trộn hỗn hợp gia vị ướp (đường mạch nha, mật ong, xì dầu, dầu hào, ngũ vị hương, tỏi băm, dầu vừng, tiêu) đun ấm cho hòa quyện rồi ướp thịt tối thiểu 3 tiếng. Nướng nồi chiên không dầu ở 180°C khoảng 20-25 phút, lật mặt quét sốt đều, thái lát mỏng.' },
      { instruction: 'Làm hoành thánh: Tôm thái hạt lựu trộn đều với thịt nạc vai xay, giò sống, mộc nhĩ nấm hương thái chỉ, hành gừng băm nhuyễn và gia vị. Cho nhân vào giữa vỏ bánh, túm mép gói chặt.' },
      { instruction: 'Chế biến hoành thánh: Thả hoành thánh vào nồi nước sôi có chút dầu ăn, luộc 1-2 phút khi nổi lên thì vớt ngay thả vào bát nước đá lạnh cho vỏ giòn dai. Một phần hoành thánh có thể chiên ngập dầu cho vàng giòn.' },
      { instruction: 'Ninh nước dùng: Xương heo và xương gà chần sạch, cho vào nồi ninh nhỏ lửa cùng tôm khô, mực khô nướng thơm, củ cải trắng, hành nướng và nấm hương. Nêm gia vị vừa miệng.' },
      { instruction: 'Hoàn thiện: Trụng mỳ tươi qua nước sôi rồi nhúng nước lạnh để sợi mỳ dai ngon. Xếp mỳ ra bát, bày thịt xá xíu, hoành thánh luộc, gan heo luộc, trứng bổ múi cau, bóng bì và hẹ cắt khúc. Chan nước dùng sôi sùng sục lên trên và thưởng thức kèm hoành thánh chiên giòn.' }
    ]
  }
};

module.exports = {
  CUSTOM_RECIPES
};
